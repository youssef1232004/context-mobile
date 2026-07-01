import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { SettingRow, Divider } from './SettingRow';

interface AccountStorageCardProps {
  onBillingPress: () => void;
  onClearCachePress: () => void;
  loading: boolean;
}

export const AccountStorageCard = React.memo(({ onBillingPress, onClearCachePress, loading }: AccountStorageCardProps) => {
  const { colors } = useTheme();

  return (
    <Card
      title="Account & Storage"
      subtitle="Manage your local app data and subscription"
      headerIcon={<Ionicons name="server-outline" size={20} color={colors.primary} />}
    >
      <View>
        <SettingRow
          icon="card-outline"
          label="Plan & Billing"
          onPress={onBillingPress}
        />
        <Divider />
        <SettingRow
          icon="trash-outline"
          label={loading ? 'Clearing...' : 'Clear Local Cache'}
          onPress={onClearCachePress}
        />
      </View>
    </Card>
  );
});
