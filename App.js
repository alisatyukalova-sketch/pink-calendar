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
  const [items, setItems] = useState([]); // Задачи и события
  const [now, setNow] = useState(new Date());

  // Календарная навигация
  const [selectedDateStr, setSelectedDateStr] = useState(''); // Формат YYYY-MM-DD
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Состояния для модального окна
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [itemType, setItemType] = useState('task'); // 'task' или 'event'
  const [formTitle, setFormTitle] = useState('');
  
  // Даты/время для задачи
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('09:00');

  // Даты/время для события
  const [formStartDate, setFormStartDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndDate, setFormEndDate] = useState('');
  const [formEndTime, setFormEndTime] = useState('18:00');

  const [formPriority, setFormPriority] = useState('medium');

  // PWA & Storage init
  useEffect(() => {
    // Регистрация мета-тегов для установки приложения на смартфон (PWA)
    if (typeof document !== 'undefined') {
      let metaMobile = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      if (!metaMobile) {
        metaMobile = document.createElement('meta');
        metaMobile.name = 'apple-mobile-web-app-capable';
        metaMobile.content = 'yes';
        document.head.appendChild(metaMobile);
      }
    }

    try {
      const saved = localStorage.getItem('pink_calendar_items_v2');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.log('Ошибка при загрузке из storage', e);
    }

    // Текущий день по умолчанию
    const today = new Date();
    setSelectedDateStr(formatYMD(today));
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pink_calendar_items_v2', JSON.stringify(items));
    } catch (e) {
      console.log('Ошибка при сохранении в storage', e);
    }
  }, [items]);

  // Обновление таймера каждую секунду
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Вспомогательные функции даты
  function formatYMD(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Автоматическая маска ввода даты (YYYY-MM-DD)
  const handleDateMask = (text, setter) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 4 && cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    } else if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
    }
    setter(formatted);
  };

  // Автоматическая маска ввода времени (HH:MM)
  const handleTimeMask = (text, setter) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    }
    setter(formatted);
  };

  // Расчет остатка времени
  const getTimerStatus = (item) => {
    if (item.type === 'event') {
      if (!item.startIso || !item.endIso) return 'Сроки не заданы';
      const start = new Date(item.startIso);
      const end = new Date(item.endIso);

      if (now < start) {
        return `⏳ До начала: ${formatDiff(start - now)}`;
      } else if (now >= start && now <= end) {
        return `🔥 Идёт прямо сейчас! До конца: ${formatDiff(end - now)}`;
      } else {
        return `✅ Событие завершено`;
      }
    } else {
      if (!item.deadlineIso) return 'Без срока';
      const target = new Date(item.deadlineIso);
      const diff = target - now;
      if (diff <= 0) return '⌛ Время вышло!';
      return `Осталось: ${formatDiff(diff)}`;
    }
  };

  const formatDiff = (diffMs) => {
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / 1000 / 60) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);

    let parts = [];
    if (days > 0) parts.push(`${days}д`);
    if (hours > 0 || days > 0) parts.push(`${hours}ч`);
    parts.push(`${minutes}м`);
    parts.push(`${seconds}с`);
    return parts.join(' ');
  };

  const formatDisplayDateTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month} ${hours}:${minutes}`;
  };

  // Генерация календаря на месяц
  const getDaysInMonthGrid = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Понедельник = 0
    const shift = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    const grid = [];

    for (let i = 0; i < shift; i++) {
      grid.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ day: d, dateStr });
    }
    return grid;
  };

  // Проверка наличия элементов в дату
  const hasItemsOnDate = (dateStr) => {
    return items.some(item => {
      if (item.type === 'event') {
        const startDate = item.startIso ? item.startIso.split('T')[0] : '';
        const endDate = item.endIso ? item.endIso.split('T')[0] : '';
        return dateStr >= startDate && dateStr <= endDate;
      } else {
        return item.deadlineIso && item.deadlineIso.split('T')[0] === dateStr;
      }
    });
  };

  // Открытие модалки создания
  const openAddModal = () => {
    setEditingId(null);
    setItemType('task');
    setFormTitle('');

    const todayStr = selectedDateStr || formatYMD(new Date());
    setFormDate(todayStr);
    setFormTime('09:00');

    setFormStartDate(todayStr);
    setFormStartTime('09:00');
    setFormEndDate(todayStr);
    setFormEndTime('18:00');

    setFormPriority('medium');
    setModalVisible(true);
  };

  // Открытие модалки редактирования
  const openEditModal = (item) => {
    setEditingId(item.id);
    setItemType(item.type || 'task');
    setFormTitle(item.title);
    setFormPriority(item.priority || 'medium');

    if (item.type === 'event') {
      if (item.startIso) {
        const [d, t] = item.startIso.split('T');
        setFormStartDate(d);
        setFormStartTime(t.slice(0, 5));
      }
      if (item.endIso) {
        const [d, t] = item.endIso.split('T');
        setFormEndDate(d);
        setFormEndTime(t.slice(0, 5));
      }
    } else {
      if (item.deadlineIso) {
        const [d, t] = item.deadlineIso.split('T');
        setFormDate(d);
        setFormTime(t.slice(0, 5));
      }
    }
    setModalVisible(true);
  };

  // Сохранение
  const handleSave = () => {
    if (!formTitle.trim()) return;

    let newItem = {
      id: editingId || Date.now().toString(),
      title: formTitle,
      priority: formPriority,
      type: itemType,
      completed: false,
    };

    if (itemType === 'event') {
      const startIso = `${formStartDate || selectedDateStr}T${formStartTime || '09:00'}:00`;
      const endIso = `${formEndDate || formStartDate || selectedDateStr}T${formEndTime || '18:00'}:00`;
      newItem.startIso = startIso;
      newItem.endIso = endIso;
    } else {
      const deadlineIso = formDate ? `${formDate}T${formTime || '09:00'}:00` : null;
      newItem.deadlineIso = deadlineIso;
    }

    if (editingId) {
      setItems(items.map(i => i.id === editingId ? { ...i, ...newItem } : i));
    } else {
      setItems([newItem, ...items]);
    }
    setModalVisible(false);
  };

  const handleDelete = (id) => {
    setItems(items.filter(i => i.id !== id));
    setModalVisible(false);
  };

  const toggleComplete = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  };

  // Фильтрованные задачи для выбранного дня
  const filteredItems = items.filter(item => {
    if (!selectedDateStr) return true;
    if (item.type === 'event') {
      const s = item.startIso ? item.startIso.split('T')[0] : '';
      const e = item.endIso ? item.endIso.split('T')[0] : '';
      return selectedDateStr >= s && selectedDateStr <= e;
    } else {
      return item.deadlineIso && item.deadlineIso.split('T')[0] === selectedDateStr;
    }
  });

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  const changeMonth = (direction) => {
    const newM = new Date(currentMonthDate);
    newM.setMonth(newM.getMonth() + direction);
    setCurrentMonthDate(newM);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F7" />
      <View style={styles.inner}>

        {/* Заголовок */}
        <Text style={styles.headerTitle}>Мой Календарь 🌸</Text>

        {/* Виджет календаря (Месяц + Дни недели) */}
        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Text style={styles.monthNavBtn}>◄</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {monthNames[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Text style={styles.monthNavBtn}>►</Text>
            </TouchableOpacity>
          </View>

          {/* Дни недели */}
          <View style={styles.weekHeader}>
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          {/* Сетка дней */}
          <View style={styles.daysGrid}>
            {getDaysInMonthGrid().map((cell, index) => {
              if (!cell) return <View key={index} style={styles.dayCellEmpty} />;

              const isSelected = selectedDateStr === cell.dateStr;
              const hasDot = hasItemsOnDate(cell.dateStr);

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDateStr(cell.dateStr)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {cell.day}
                  </Text>
                  {hasDot && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Панель списка задач */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedDateStr ? `Задачи на ${selectedDateStr}` : 'Все задачи'}
          </Text>
          {selectedDateStr !== '' && (
            <TouchableOpacity onPress={() => setSelectedDateStr('')}>
              <Text style={styles.resetFilterText}>Показать все</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Нет событий или задач 🎈</Text>
              <Text style={styles.emptySubText}>Нажми кнопку ниже для добавления!</Text>
            </View>
          ) : (
            filteredItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.taskCard, item.completed && styles.taskCardCompleted]}
                onPress={() => openEditModal(item)}
                activeOpacity={0.7}
              >
                <TouchableOpacity
                  style={[styles.checkbox, item.completed && styles.checkboxActive]}
                  onPress={() => toggleComplete(item.id)}
                >
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>

                <View style={[
                  styles.priorityTag, 
                  { backgroundColor: item.type === 'event' ? '#B5E2FA' : '#FF758F' }
                ]} />

                <View style={styles.taskContent}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
                      {item.title}
                    </Text>
                    {item.type === 'event' && <Text style={styles.eventBadge}>Событие</Text>}
                  </View>

                  <Text style={styles.taskFormattedDate}>
                    {item.type === 'event' 
                      ? `${formatDisplayDateTime(item.startIso)} — ${formatDisplayDateTime(item.endIso)}`
                      : (item.deadlineIso ? formatDisplayDateTime(item.deadlineIso) : 'Без срока')
                    }
                  </Text>

                  <Text style={styles.taskTimer}>
                    {getTimerStatus(item)}
                  </Text>
                </View>

                <Text style={styles.editHint}>✎</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Добавить задачу или событие</Text>
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
              {editingId ? 'Редактировать' : 'Новое запись'}
            </Text>

            {/* Выбор типа: Задача или Событие */}
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, itemType === 'task' && styles.typeBtnActive]}
                onPress={() => setItemType('task')}
              >
                <Text style={[styles.typeBtnText, itemType === 'task' && styles.typeBtnTextActive]}>Задача</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, itemType === 'event' && styles.typeBtnActive]}
                onPress={() => setItemType('event')}
              >
                <Text style={[styles.typeBtnText, itemType === 'event' && styles.typeBtnTextActive]}>Событие</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Название</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Введите название..."
              placeholderTextColor="#B0A8B9"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            {itemType === 'task' ? (
              /* Поля для ЗАДАЧИ */
              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Дата (ГГГГ-ММ-ДД)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-09-15"
                    placeholderTextColor="#B0A8B9"
                    keyboardType="numeric"
                    maxLength={10}
                    value={formDate}
                    onChangeText={(txt) => handleDateMask(txt, setFormDate)}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>Время (ЧЧ:ММ)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="09:00"
                    placeholderTextColor="#B0A8B9"
                    keyboardType="numeric"
                    maxLength={5}
                    value={formTime}
                    onChangeText={(txt) => handleTimeMask(txt, setFormTime)}
                  />
                </View>
              </View>
            ) : (
              /* Поля для СОБЫТИЯ (С ... ПО ...) */
              <View>
                <Text style={styles.sectionSubTitle}>Начало события:</Text>
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Дата начала"
                      keyboardType="numeric"
                      maxLength={10}
                      value={formStartDate}
                      onChangeText={(txt) => handleDateMask(txt, setFormStartDate)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Время начала"
                      keyboardType="numeric"
                      maxLength={5}
                      value={formStartTime}
                      onChangeText={(txt) => handleTimeMask(txt, setFormStartTime)}
                    />
                  </View>
                </View>

                <Text style={styles.sectionSubTitle}>Окончание события:</Text>
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Дата конца"
                      keyboardType="numeric"
                      maxLength={10}
                      value={formEndDate}
                      onChangeText={(txt) => handleDateMask(txt, setFormEndDate)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Время конца"
                      keyboardType="numeric"
                      maxLength={5}
                      value={formEndTime}
                      onChangeText={(txt) => handleTimeMask(txt, setFormEndTime)}
                    />
                  </View>
                </View>
              </View>
            )}

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
              {editingId && (
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => handleDelete(editingId)}
                >
                  <Text style={styles.deleteBtnText}>Удалить</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Сохранить</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A3E3D',
    marginBottom: 12,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthNavBtn: {
    fontSize: 16,
    color: '#FF758F',
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A3E3D',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekDayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#A09090',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: '#FF758F',
  },
  dayText: {
    fontSize: 13,
    color: '#4A3E3D',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF758F',
    marginTop: 2,
  },
  dotSelected: {
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A3E3D',
  },
  resetFilterText: {
    fontSize: 12,
    color: '#FF758F',
    fontWeight: '600',
  },
  taskList: {
    flex: 1,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8A7A7A',
  },
  emptySubText: {
    fontSize: 12,
    color: '#B0A8B9',
    marginTop: 4,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
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
    width: 5,
    height: 38,
    borderRadius: 3,
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  eventBadge: {
    backgroundColor: '#E0F2FE',
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskFormattedDate: {
    fontSize: 11,
    color: '#8A7A7A',
    marginTop: 2,
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
    marginLeft: 6,
  },
  addButton: {
    backgroundColor: '#FFB3C1',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A3E3D',
    marginBottom: 12,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeBtnActive: {
    backgroundColor: '#FF758F',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A7A7A',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A7A7A',
    marginBottom: 4,
  },
  sectionSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF758F',
    marginTop: 4,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#FFF0F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#4A3E3D',
    marginBottom: 10,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#4A3E3D',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FFE5EC',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#C9184A',
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#FF758F',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  closeBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#A09090',
    fontSize: 12,
  },
});

