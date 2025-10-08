
import React from 'react';
import { Tabs } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { colors } from '../../styles/commonStyles';

export default function TabLayout() {
  const tabs = [
    {
      name: 'pacientes',
      route: '/(tabs)/pacientes',
      icon: 'person.3.fill',
      label: '👥 Pacientes',
    },
    {
      name: 'sillones',
      route: '/(tabs)/sillones',
      icon: 'chair.fill',
      label: '🪑 Sillones',
    },
    {
      name: 'inventario',
      route: '/(tabs)/inventario',
      icon: 'pills.fill',
      label: '💊 Inventario',
    },
  ];

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="pacientes" />
        <Tabs.Screen name="sillones" />
        <Tabs.Screen name="inventario" />
      </Tabs>
      <FloatingTabBar tabs={tabs} containerWidth={300} />
    </>
  );
}
