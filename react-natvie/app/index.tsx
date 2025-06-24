import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Type definitions
interface FileConverterResponse {
  task_id: string;
}

interface StatusResponse {
  status: 'completed' | 'processing' | 'error';
  download_url?: string;
  error?: string;
}

interface OutputFormat {
  label: string;
  value: string;
}

// Mock API functions - replace with your actual API endpoints
const fileConverterApi = {
  uploadFile: async (file: DocumentPicker.DocumentPickerAsset, outputFormat: string): Promise<FileConverterResponse> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ task_id: 'mock_task_' + Date.now() });
      }, 1000);
    });
  },
  checkStatus: async (taskId: string): Promise<StatusResponse> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'completed',
          download_url: 'https://example.com/download/' + taskId
        });
      }, 2000);
    });
  }
};

export default function FileConverterApp() {
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [inputFormat, setInputFormat] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('pdf');
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'uploading' | 'converting' | 'completed' | 'error'>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const outputFormats: OutputFormat[] = [
    { label: 'PDF', value: 'pdf' },
    { label: 'DOCX', value: 'docx' },
    { label: 'PNG', value: 'png' },
    { label: 'JPG', value: 'jpg' },
  ];

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setConversionStatus('idle');
        setDownloadUrl(null);
        setErrorMessage(null);
        setTaskId(null);

        // Extract file extension
        const ext = file.name.split('.').pop();
        if (ext) {
          setInputFormat(`.${ext.toLowerCase()}`);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    try {
      setConversionStatus('uploading');
      setErrorMessage(null);

      // Upload file to backend
      const response = await fileConverterApi.uploadFile(selectedFile, outputFormat);
      setTaskId(response.task_id);
      setConversionStatus('converting');

      // Start polling for status
      pollConversionStatus(response.task_id);
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMessage('Failed to upload file. Please try again.');
      setConversionStatus('error');
    }
  };

  const pollConversionStatus = async (taskId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await fileConverterApi.checkStatus(taskId);
        
        if (status.status === 'completed' && status.download_url) {
          setDownloadUrl(status.download_url);
          setConversionStatus('completed');
          return;
        } else if (status.status === 'error' || status.error) {
          setErrorMessage(status.error || 'Conversion failed');
          setConversionStatus('error');
          return;
        } else if (status.status === 'processing') {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000);
          } else {
            setErrorMessage('Conversion timeout. Please try again.');
            setConversionStatus('error');
          }
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000);
          } else {
            setErrorMessage('Conversion timeout. Please try again.');
            setConversionStatus('error');
          }
        }
      } catch (error) {
        console.error('Status check failed:', error);
        setErrorMessage('Failed to check conversion status.');
        setConversionStatus('error');
      }
    };

    poll();
  };

  const handleDownload = async () => {
    if (downloadUrl) {
      try {
        await Linking.openURL(downloadUrl);
      } catch (error) {
        Alert.alert('Error', 'Failed to open download link');
      }
    }
  };

  const getStatusIcon = () => {
    switch (conversionStatus) {
      case 'uploading':
      case 'converting':
        return <ActivityIndicator size="small" color="#FCD34D" />;
      case 'completed':
        return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
      case 'error':
        return <Ionicons name="alert-circle" size={20} color="#EF4444" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (conversionStatus) {
      case 'uploading':
        return 'Uploading...';
      case 'converting':
        return 'Converting...';
      case 'completed':
        return 'Ready!';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  const isConverting = conversionStatus === 'uploading' || conversionStatus === 'converting';
  const canConvert = selectedFile && conversionStatus === 'idle';
  const canDownload = conversionStatus === 'completed' && downloadUrl;

  return (
    <SafeAreaView className="flex-1 bg-gray-800">
      <View className="flex-1 px-5 pt-10">
        {/* Header */}
        <View className="items-center mb-15">
          <Text className="text-4xl font-bold text-white text-center mb-4">
            Free File Converter
          </Text>
          <View className="items-center">
            <Text className="text-xl font-semibold">
              <Text className="text-cyan-500">Upload. </Text>
              <Text className="text-yellow-400">Create. </Text>
              <Text className="text-purple-500">Export.</Text>
            </Text>
          </View>
        </View>

        {/* File Upload Section */}
        <View className="flex-1 items-center">
          <TouchableOpacity
            className={`w-full h-30 bg-gray-700 rounded-2xl border-2 border-gray-600 border-dashed justify-center items-center mb-8 ${
              isConverting ? 'opacity-50' : ''
            }`}
            onPress={handleFilePick}
            disabled={isConverting}
          >
            <Ionicons name="cloud-upload-outline" size={32} color="#14B8A6" />
            <Text className="text-gray-300 text-base mt-2 text-center px-5">
              {selectedFile ? selectedFile.name : 'Choose File'}
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <View className="flex-row items-center mb-8 gap-4">
              {/* Input Format */}
              <View className="bg-gray-700 px-4 py-2 rounded-xl">
                <Text className="text-white text-base font-semibold">
                  {inputFormat || '.format'}
                </Text>
              </View>

              {/* Arrow */}
              <Ionicons name="arrow-forward" size={24} color="#FCD34D" />

              {/* Output Format */}
              <View className="bg-gray-700 px-4 py-2 rounded-xl">
                <Text className="text-white text-base font-semibold">
                  .{outputFormat}
                </Text>
              </View>
            </View>
          )}

          {/* Output Format Selection */}
          {selectedFile && (
            <View className="w-full mb-8">
              <Text className="text-white text-base font-semibold mb-3 text-center">
                Output Format:
              </Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                {outputFormats.map((format) => (
                  <TouchableOpacity
                    key={format.value}
                    className={`px-4 py-2 rounded-xl border ${
                      outputFormat === format.value
                        ? 'bg-teal-500 border-teal-500'
                        : 'bg-gray-700 border-gray-600'
                    } ${isConverting ? 'opacity-50' : ''}`}
                    onPress={() => setOutputFormat(format.value)}
                    disabled={isConverting}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        outputFormat === format.value
                          ? 'text-white'
                          : 'text-gray-300'
                      }`}
                    >
                      {format.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Convert/Download Button */}
          {selectedFile && (
            <TouchableOpacity
              className={`w-full py-4 rounded-xl mb-5 ${
                canDownload
                  ? 'bg-green-600'
                  : 'bg-gray-700'
              } ${
                !canConvert && !canDownload ? 'opacity-50' : ''
              }`}
              onPress={canDownload ? handleDownload : handleConvert}
              disabled={!canConvert && !canDownload}
            >
              <View className="flex-row items-center justify-center gap-2">
                {canDownload ? (
                  <Ionicons name="download-outline" size={20} color="white" />
                ) : (
                  getStatusIcon()
                )}
                <Text className="text-white text-base font-semibold">
                  {canDownload ? 'Download' : (getStatusText() || 'Convert')}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Status Messages */}
          {errorMessage && (
            <View className="w-full bg-red-600 p-4 rounded-xl mb-4">
              <Text className="text-white text-center text-sm">
                {errorMessage}
              </Text>
            </View>
          )}

          {conversionStatus === 'converting' && taskId && (
            <View className="w-full bg-blue-600 p-4 rounded-xl">
              <Text className="text-white text-center text-sm">
                Converting your file... Task ID: {taskId}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
