import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddStackParamList } from '../../navigation/types';
import { AuthGate } from '../../components/AuthGate';

type Props = NativeStackScreenProps<AddStackParamList, 'AuthGate'>;

export function AuthGateScreen({ navigation }: Props) {
  return (
    <AuthGate
      onSignIn={() => navigation.navigate('AddRestroom')}
      onSignUp={() => navigation.navigate('AddRestroom')}
      message="Create an account to add a restroom to the community."
    />
  );
}
