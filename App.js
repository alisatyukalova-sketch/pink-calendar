import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, SafeAreaView, StatusBar } from 'react-native';

export default function App() {
  const [scheduleUrl, setScheduleUrl] = useState('');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Подготовка к ЕГЭ: Профильная математика', deadline: 'Осталось: 4 ч. 20 мин.', priority: 'high' },
    { id: 2, title: 'Загрузить расписание РЭУ', deadline: 'Завтра, 09:00', priority: 'medium' },
    { id: 3, title: 'Встреча рабочей группы', deadline: '15 сентября', priority: 'low' },
  ]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF758F';   // Ярко-розовый (высокий приоритет)
      case 'medium': return '#FFB3C1'; // Пудровый (средний)
      default: return '#E2ECE9';       // Мягкий мятный (низкий)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F7" />
      <View style={styles.inner}>
        
        <Text style={styles.headerTitle}>Мой Календарь</Text>
        
        {/* Блок подгрузки расписания */}
        <View style={styles.urlCard}>
          <Text style={styles.sectionLabel}>Ссылка на расписание</Text>
          <TextInput 
            style={styles.urlInput}
            placeholder="Вставь ссылку на расписание..."
            placeholderTextColor="#B0A8B9"
            value={scheduleUrl}
            onChangeText={setScheduleUrl}
          />
        </View>

        {/* Виджет срочного дедлайна */}
        <View style={styles.widgetCard}>
          <Text style={styles.widgetBadge}>Срочный дедлайн</Text>
          <Text style={styles.widgetTitle}>{tasks[0]?.title}</Text>
          <Text style={styles.widgetTimer}>{tasks[0]?.deadline}</Text>
        </View>

        {/* Список задач */}
        <Text style={styles.sectionTitle}>Все задачи</Text>
        <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
          {tasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(task.priority) }]} />
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDeadline}>{task.deadline}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Добавить задачу</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4A3E3D',
    marginBottom: 15,
  },
  urlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#8A7A7A',
    marginBottom: 6,
    fontWeight: '600',
  },
  urlInput: {
    backgroundColor: '#FFF0F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#4A3E3D',
  },
  widgetCard: {
    backgroundColor: '#FFCCD5',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  widgetBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C9184A',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#590D22',
  },
  widgetTimer: {
    fontSize: 14,
    color: '#800F2F',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3E3D',
    marginBottom: 10,
  },
  taskList: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityTag: {
    width: 8,
    height: 36,
    borderRadius: 4,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A3E3D',
  },
  taskDeadline: {
    fontSize: 12,
    color: '#A09090',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#FFB3C1',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 15,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
