import React, { useState, useEffect } from 'react';
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
  const [tasks, setTasks] = useState([]);
  const [now, setNow] = useState(new Date());

  // Состояния для модального окна
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formPriority, setFormPriority] = useState('medium');

  // 1. Загрузка задач из localStorage при первом старте
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('pink_calendar_tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (e) {
      console.log('Ошибка при загрузке задач из localStorage', e);
    }
  }, []);

  // 2. Автоматическое сохранение задач при любом их изменении
  useEffect(() => {
    try {
      localStorage.setItem('pink_calendar_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.log('Ошибка при сохранении задач', e);
    }
  }, [tasks]);

  // 3. Обновление текущего времени каждую секунду (для работы отсчёта)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Функция расчета оставшегося времени
  const getRemainingTime = (targetIsoDate) => {
    if (!targetIsoDate) return 'Без срока';
    const target = new Date(targetIsoDate);
    const diff = target - now;

    if (isNaN(target.getTime())) return 'Неверная дата';
    if (diff <= 0) return '⌛ Время вышло!';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    let parts = [];
    if (days > 0) parts.push(`${days} дн.`);
    if (hours > 0 || days > 0) parts.push(`${hours} ч.`);
    parts.push(`${minutes} мин.`);
    parts.push(`${seconds} сек.`);

    return `Осталось: ${parts.join(' ')}`;
  };

  // Красивое отображение даты и времени
  const formatDateTime = (isoDateStr) => {
    if (!isoDateStr) return '';
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month} в ${hours}:${minutes}`;
  };

  // Открытие окна создания
  const openAddModal = () => {
    setEditingTaskId(null);
    setFormTitle('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    
    setFormDate(`${yyyy}-${mm}-${dd}`);
    setFormTime('09:00');
    setFormPriority('medium');
    setModalVisible(true);
  };

  // Открытие окна редактирования
  const openEditModal = (task) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    if (task.deadlineIso) {
      const d = new Date(task.deadlineIso);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setFormDate(`${yyyy}-${mm}-${dd}`);
      setFormTime(`${hh}:${min}`);
    } else {
      setFormDate('');
      setFormTime('09:00');
    }
    setFormPriority(task.priority);
    setModalVisible(true);
  };

  // Сохранение задачи
  const handleSaveTask = () => {
    if (!formTitle.trim()) return;

    let deadlineIso = null;
    if (formDate) {
      const timeParts = formTime.split(':');
      const hh = timeParts[0] || '00';
      const mm = timeParts[1] || '00';
      deadlineIso = new Date(`${formDate}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:00`).toISOString();
    }

    if (editingTaskId) {
      setTasks(tasks.map(t => t.id === editingTaskId ? {
        ...t,
        title: formTitle,
        deadlineIso: deadlineIso,
        priority: formPriority,
      } : t));
    } else {
      const newTask = {
        id: Date.now().toString(),
        title: formTitle,
        deadlineIso: deadlineIso,
        priority: formPriority,
        completed: false,
      };
      setTasks([newTask, ...tasks]);
    }
    setModalVisible(false);
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    setModalVisible(false);
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF758F';
      case 'medium': return '#FFB3C1';
      default: return '#E2ECE9';
    }
  };

  const urgentTask = tasks.find(t => !t.completed && t.priority === 'high' && t.deadlineIso) 
    || tasks.find(t => !t.completed && t.deadlineIso);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F7" />
      <View style={styles.inner}>
        
        <Text style={styles.headerTitle}>Мой Календарь</Text>

        {/* Срочный дедлайн */}
        {urgentTask && (
          <TouchableOpacity 
            style={styles.widgetCard}
            onPress={() => openEditModal(urgentTask)}
            activeOpacity={0.8}
          >
            <Text style={styles.widgetBadge}>⚡ Ближайший дедлайн ({formatDateTime(urgentTask.deadlineIso)})</Text>
            <Text style={styles.widgetTitle}>{urgentTask.title}</Text>
            <Text style={styles.widgetTimer}>{getRemainingTime(urgentTask.deadlineIso)}</Text>
          </TouchableOpacity>
        )}

        {/* Список задач */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Все задачи</Text>
          <Text style={styles.subText}>Нажми для изменения</Text>
        </View>

        <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>У вас пока нет задач ✨</Text>
              <Text style={styles.emptySubText}>Нажмите кнопку ниже, чтобы создать первую!</Text>
            </View>
          ) : (
            tasks.map(task => (
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
                  <Text style={styles.taskFormattedDate}>
                    {task.deadlineIso ? formatDateTime(task.deadlineIso) : 'Без срока'}
                  </Text>
                  <Text style={styles.taskTimer}>
                    {getRemainingTime(task.deadlineIso)}
                  </Text>
                </View>

                <Text style={styles.editHint}>✎</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Добавить задачу</Text>
        </TouchableOpacity>

      </View>

      {/* Модальное окно */}
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
              placeholder="Например: Сделать домашнее задание"
              placeholderTextColor="#B0A8B9"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.inputLabel}>Дата (ГГГГ-ММ-ДД)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="2026-09-15"
                  placeholderTextColor="#B0A8B9"
                  value={formDate}
                  onChangeText={setFormDate}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.inputLabel}>Время (ЧЧ:ММ)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="09:00"
                  placeholderTextColor="#B0A8B9"
                  value={formTime}
                  onChangeText={setFormTime}
                />
              </View>
            </View>

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
    fontSize: 13,
    color: '#800F2F',
    marginTop: 6,
    fontWeight: '600',
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
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A7A7A',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 12,
    color: '#B0A8B9',
    textAlign: 'center',
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
    opacity: 0.5,
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
    height: 42,
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
  taskFormattedDate: {
    fontSize: 11,
    color: '#8A7A7A',
    marginTop: 2,
    fontWeight: '500',
  },
  taskTimer: {
    fontSize: 11,
    color: '#FF758F',
    marginTop: 2,
    fontWeight: '700',
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
    fontSize: 11,
    fontWeight: '600',
    color: '#8A7A7A',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#4A3E3D',
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginHorizontal: 3,
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

