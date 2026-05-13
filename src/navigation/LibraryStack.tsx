import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LibraryScreen from '../features/documents/screens/LibraryScreen';
import ReadingScreen from '../features/documents/screens/ReadingScreen';
import CompareScreen from '../features/comparison/screens/CompareScreen';
import FolderProposalScreen from '../features/folders/screens/FolderProposalScreen';

const Stack = createNativeStackNavigator();

export default function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Reading" component={ReadingScreen} />
      <Stack.Screen name="Compare" component={CompareScreen} />
      <Stack.Screen name="FolderProposal" component={FolderProposalScreen} />
    </Stack.Navigator>
  );
}
