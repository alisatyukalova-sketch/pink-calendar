import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';

export default function App() {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Подготовка к ЕГЭ: Профильная математика', deadline: 'Осталось: 4 ч. 20 мин.', priority: 'high', completed: false },
    { id: '2', title: 'Загрузить расписание', deadline: 'Завтра, 09:00', priority: 'medium', completed: false },
    { id: '3', title: 'Встреча рабочей группы', deadline: '15 сентября', priority: 'low', completed: false },
  ]);

  // Состояния для модального окна
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formPriority, setFormPriority] = useState('medium');

  // Открытие окна для новой задачи
  const openAddModal = () => {
    setEditingTaskId(null);
    setFormTitle('');
    setFormDeadline('');
    setFormPriority('medium');
    setModalVisible(true);
  };

  // Открытие окна для редактирования
  const openEditModal = (task) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDeadline(task.deadline);
    setFormPriority(task.priority);
    setModalVisible(true);
  };

  // Сохранение (создание или обновление)
  const handleSaveTask = () => {
    if (!formTitle.trim()) return;

    if (editingTaskId) {
      setTasks(tasks.map(t => t.id === editingTaskId ? {
        ...t,
        title: formTitle,
        deadline: formDeadline || 'Без дедлайна',
        priority: formPriority,
      } : t));
    } else {
      const newTask = {
        id: Date.now().toString(),
        title: formTitle,
        deadline: formDeadline || 'Без дедлайна',
        priority: formPriority,
        completed: false,
      };
      setTasks([newTask, ...tasks]);
    }
    setModalVisible(false);
  };

  // Удаление задачи
  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    setModalVisible(false);
  };

  // Переключение выполнено / не выполнено
  const toggleComplete = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF758F';   // Ярко-розовый
      case 'medium': return '#FFB3C1'; // Пудровый
      default: return '#E2ECE9';       // Мятный
    }
  };

  const urgentTask = tasks.find(t => !t.completed && t.priority === 'high') || tasks.find(t => !t.completed);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F7" />
      <View style={styles.inner}>
        
        <Text style={styles.headerTitle}>Мой Календарь</Text>

        {/* Виджет срочного дедлайна */}
        {urgentTask && (
          <TouchableOpacity 
            style={styles.widgetCard}
            onPress={() => openEditModal(urgentTask)}
            activeOpacity={0.8}
          >
            <Text style={styles.widgetBadge}>⚡ Срочный дедлайн</Text>
            <Text style={styles.widgetTitle}>{urgentTask.title}</Text>
            <Text style={styles.widgetTimer}>{urgentTask.deadline}</Text>
          </TouchableOpacity>
        )}

        {/* Список задач */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Все задачи</Text>
          <Text style={styles.subText}>Нажми на задачу для изменения</Text>
        </View>

        <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
          {tasks.map(task => (
            <TouchableOpacity 
              key={task.id} 
              style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
              onPress={() => openEditModal(task)}
              activeOpacity={0.7}
            >
              <TouchableOpacity 
                style={[styles.checkbox, task.completed && styles.checkboxActive]}
                onPress={() => toggleComplete(task.id)}
              >
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(task.priority) }]} />
              
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                  {task.title}
                </Text>
                <Text style={styles.taskDeadline}>{task.deadline}</Text>
              </View>

              <Text style={styles.editHint}>✎</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Добавить задачу</Text>
        </TouchableOpacity>

      </View>

      {/* Всплывающее окно создания / редактирования */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTaskId ? 'Редактировать задачу' : 'Новая задача'}
            </Text>

            <Text style={styles.inputLabel}>Название задачи</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Например: Подготовка к экзамену"
              placeholderTextColor="#B0A8B9"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <Text style={styles.inputLabel}>Срок / Дедлайн</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Например: Завтра в 15:00"
              placeholderTextColor="#B0A8B9"
              value={formDeadline}
              onChangeText={setFormDeadline}
            />

            <Text style={styles.inputLabel}>Приоритет</Text>
            <View style={styles.prioritySelector}>
              {[
                { id: 'high', label: 'Высокий', color: '#FF758F' },
                { id: 'medium', label: 'Средний', color: '#FFB3C1' },
                { id: 'low', label: 'Низкий', color: '#D8E2DC' }
              ].map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.priorityBtn,
                    { backgroundColor: item.color },
                    formPriority === item.id && styles.priorityBtnSelected
                  ]}
                  onPress={() => setFormPriority(item.id)}
                >
                  <Text style={styles.priorityBtnText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              {editingTaskId && (
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => handleDeleteTask(editingTaskId)}
                >
                  <Text style={styles.deleteBtnText}>Удалить</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveTask}
              >
                <Text style={styles.saveBtnText}>Сохранить</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Отмена</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

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
    marginBottom: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3E3D',
  },
  subText: {
    fontSize: 11,
    color: '#A09090',
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
  taskCardCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFB3C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#FF758F',
    borderColor: '#FF758F',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priorityTag: {
    width: 6,
    height: 36,
    borderRadius: 3,
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
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  taskDeadline: {
    fontSize: 12,
    color: '#A09090',
    marginTop: 2,
  },
  editHint: {
    fontSize: 16,
    color: '#FFB3C1',
    marginLeft: 8,
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
  /* Стили всплывающего окна */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A3E3D',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A7A7A',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#4A3E3D',
    marginBottom: 14,
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    opacity: 0.7,
  },
  priorityBtnSelected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#4A3E3D',
  },
  priorityBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A3E3D',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FFE5EC',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#C9184A',
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#FF758F',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#A09090',
    fontSize: 13,
  },
});

