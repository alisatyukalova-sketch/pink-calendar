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
  const [items, setItems] = useState([]); // Задачи, события, пары
  const [now, setNow] = useState(new Date());
  const [deviceId, setDeviceId] = useState('');

  // Календарная навигация
  const [selectedDateStr, setSelectedDateStr] = useState(''); // YYYY-MM-DD
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Состояния для модального окна
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [itemType, setItemType] = useState('task'); // 'task', 'event', 'class'
  const [formTitle, setFormTitle] = useState('');
  
  // Задача
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formPriority, setFormPriority] = useState('medium');

  // Событие (с - по)
  const [formStartDate, setFormStartDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndDate, setFormEndDate] = useState('');
  const [formEndTime, setFormEndTime] = useState('18:00');

  // Пара (университет)
  const [formClassDate, setFormClassDate] = useState('');
  const [formClassTime, setFormClassTime] = useState('09:00');
  const [formClassSubtype, setFormClassSubtype] = useState('lecture'); // lecture, practice, seminar

  // Инициализация устройства, хранилища и параметров из URL (если поделились)
  useEffect(() => {
    // 1. Управление устройством / сессией
    let storedDeviceId = localStorage.getItem('pink_calendar_device_id');
    if (!storedDeviceId) {
      storedDeviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pink_calendar_device_id', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    // 2. Проверка, не открыта ли ссылка с расписанием от другого пользователя
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('shared');

    if (sharedData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedData)));
        if (Array.isArray(decoded)) {
          setItems(decoded);
          localStorage.setItem(`pink_calendar_items_${storedDeviceId}`, JSON.stringify(decoded));
        }
      } catch (e) {
        console.log('Ошибка импорта общего расписания', e);
      }
    } else {
      // Загрузка со своего устройства
      try {
        const saved = localStorage.getItem(`pink_calendar_items_${storedDeviceId}`);
        if (saved) {
          setItems(JSON.parse(saved));
        }
      } catch (e) {
        console.log('Ошибка загрузки локальных данных', e);
      }
    }

    const today = new Date();
    setSelectedDateStr(formatYMD(today));
  }, []);

  // Автосохранение при любых изменениях
  useEffect(() => {
    if (deviceId && items.length >= 0) {
      try {
        localStorage.setItem(`pink_calendar_items_${deviceId}`, JSON.stringify(items));
      } catch (e) {
        console.log('Ошибка сохранения', e);
      }
    }
  }, [items, deviceId]);

  // Таймер обновления
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function formatYMD(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Маски ввода
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

  const handleTimeMask = (text, setter) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    }
    setter(formatted);
  };

  // Поделиться расписанием
  const handleShare = () => {
    try {
      const jsonStr = JSON.stringify(items);
      const encoded = btoa(encodeURIComponent(jsonStr));
      const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${encoded}`;
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        alert('Ссылка на расписание скопирована в буфер обмена! 📋 Перешли её другу.');
      } else {
        prompt('Скопируйте эту ссылку:', shareUrl);
      }
    } catch (e) {
      alert('Не удалось создать ссылку для поделиться.');
    }
  };

  // Статус таймера
  const getTimerStatus = (item) => {
    if (item.type === 'event') {
      if (!item.startIso || !item.endIso) return 'Сроки не заданы';
      const start = new Date(item.startIso);
      const end = new Date(item.endIso);
      if (now < start) return `⏳ До начала: ${formatDiff(start - now)}`;
      if (now >= start && now <= end) return `🔥 Идёт! До конца: ${formatDiff(end - now)}`;
      return `✅ Завершено`;
    } else {
      const iso = item.type === 'class' ? item.classIso : item.deadlineIso;
      if (!iso) return 'Без срока';
      const target = new Date(iso);
      const diff = target - now;
      if (diff <= 0) return item.type === 'class' ? '🎓 Пара началась/прошла' : '⌛ Время вышло!';
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

  // Получить цвет полоски для элемента
  const getItemColor = (item) => {
    if (item.type === 'event') return '#C5832B'; // Чуть темнее для событий
    if (item.type === 'class') {
      if (item.subtype === 'lecture') return '#FDE047';   // Желтый
      if (item.subtype === 'seminar') return '#FB923C';   // Оранжевый
      if (item.subtype === 'practice') return '#38BDF8';  // Голубой
    }
    // Для задачи по приоритету
    if (item.priority === 'high') return '#FF758F';
    if (item.priority === 'medium') return '#FFB3C1';
    return '#A3CECB';
  };

  // Сетка месяца
  const getDaysInMonthGrid = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const shift = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const grid = [];

    for (let i = 0; i < shift; i++) grid.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ day: d, dateStr });
    }
    return grid;
  };

  // Получить все элементы, затрагивающие конкретный день (для полосок в календаре)
  const getItemsForDate = (dateStr) => {
    return items.filter(item => {
      if (item.type === 'event') {
        const start = item.startIso ? item.startIso.split('T')[0] : '';
        const end = item.endIso ? item.endIso.split('T')[0] : '';
        return dateStr >= start && dateStr <= end;
      } else if (item.type === 'class') {
        return item.classIso && item.classIso.split('T')[0] === dateStr;
      } else {
        return item.deadlineIso && item.deadlineIso.split('T')[0] === dateStr;
      }
    });
  };

  // Модальные окна
  const openAddModal = () => {
    setEditingId(null);
    setItemType('task');
    setFormTitle('');
    const todayStr = selectedDateStr || formatYMD(new Date());
    
    setFormDate(todayStr);
    setFormTime('09:00');
    setFormPriority('medium');

    setFormStartDate(todayStr);
    setFormStartTime('09:00');
    setFormEndDate(todayStr);
    setFormEndTime('18:00');

    setFormClassDate(todayStr);
    setFormClassTime('09:00');
    setFormClassSubtype('lecture');

    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setItemType(item.type || 'task');
    setFormTitle(item.title);

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
    } else if (item.type === 'class') {
      setFormClassSubtype(item.subtype || 'lecture');
      if (item.classIso) {
        const [d, t] = item.classIso.split('T');
        setFormClassDate(d);
        setFormClassTime(t.slice(0, 5));
      }
    } else {
      setFormPriority(item.priority || 'medium');
      if (item.deadlineIso) {
        const [d, t] = item.deadlineIso.split('T');
        setFormDate(d);
        setFormTime(t.slice(0, 5));
      }
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;

    let newItem = {
      id: editingId || Date.now().toString(),
      title: formTitle,
      type: itemType,
      completed: false,
    };

    if (itemType === 'event') {
      newItem.startIso = `${formStartDate || selectedDateStr}T${formStartTime || '09:00'}:00`;
      newItem.endIso = `${formEndDate || formStartDate || selectedDateStr}T${formEndTime || '18:00'}:00`;
    } else if (itemType === 'class') {
      newItem.subtype = formClassSubtype;
      newItem.classIso = `${formClassDate || selectedDateStr}T${formClassTime || '09:00'}:00`;
    } else {
      newItem.priority = formPriority;
      newItem.deadlineIso = formDate ? `${formDate}T${formTime || '09:00'}:00` : null;
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

  // Фильтрация элементов для отображения в списке под календарём
  const filteredItems = items.filter(item => {
    if (!selectedDateStr) return true;
    if (item.type === 'event') {
      const s = item.startIso ? item.startIso.split('T')[0] : '';
      const e = item.endIso ? item.endIso.split('T')[0] : '';
      return selectedDateStr >= s && selectedDateStr <= e;
    } else if (item.type === 'class') {
      return item.classIso && item.classIso.split('T')[0] === selectedDateStr;
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

        {/* Верхняя панель управления */}
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>Мой Календарь 🌸</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>🔗 Поделиться</Text>
          </TouchableOpacity>
        </View>

        {/* Календарь с полосками задач */}
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

          <View style={styles.weekHeader}>
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {getDaysInMonthGrid().map((cell, index) => {
              if (!cell) return <View key={index} style={styles.dayCellEmpty} />;

              const isSelected = selectedDateStr === cell.dateStr;
              const dayItems = getItemsForDate(cell.dateStr);

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDateStr(cell.dateStr)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {cell.day}
                  </Text>
                  
                  {/* Полоски индикаторов (сколько задач — столько полосок, события толще) */}
                  <View style={styles.stripesContainer}>
                    {dayItems.slice(0, 3).map((item, sIndex) => {
                      const isEvt = item.type === 'event';
                      return (
                        <View 
                          key={sIndex} 
                          style={[
                            styles.stripe, 
                            { 
                              backgroundColor: getItemColor(item),
                              height: isEvt ? 5 : 3, // События толще
                              borderRadius: isEvt ? 2.5 : 1.5,
                            }
                          ]} 
                        />
                      );
                    })}
                    {dayItems.length > 3 && (
                      <Text style={styles.moreStripesText}>+</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Список под календарём */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedDateStr ? `План на ${selectedDateStr}` : 'Все записи'}
          </Text>
          {selectedDateStr !== '' && (
            <TouchableOpacity onPress={() => setSelectedDateStr('')}>
              <Text style={styles.resetFilterText}>Сбросить фильтр</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
          {filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Ничего не запланировано ✨</Text>
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

                <View style={[styles.priorityTag, { backgroundColor: getItemColor(item) }]} />

                <View style={styles.taskContent}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
                      {item.title}
                    </Text>
                    {item.type === 'event' && <Text style={[styles.badge, { backgroundColor: '#FEF3C7', color: '#B45309' }]}>Событие</Text>}
                    {item.type === 'class' && (
                      <Text style={[
                        styles.badge, 
                        { 
                          backgroundColor: item.subtype === 'lecture' ? '#FEF9C3' : item.subtype === 'seminar' ? '#FFEDD5' : '#E0F2FE',
                          color: item.subtype === 'lecture' ? '#854D0E' : item.subtype === 'seminar' ? '#C2410C' : '#0369A1'
                        }
                      ]}>
                        {item.subtype === 'lecture' ? 'Лекция' : item.subtype === 'seminar' ? 'Семинар' : 'Практика'}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.taskFormattedDate}>
                    {item.type === 'event' 
                      ? `${formatDisplayDateTime(item.startIso)} — ${formatDisplayDateTime(item.endIso)}`
                      : (item.type === 'class' ? formatDisplayDateTime(item.classIso) : (item.deadlineIso ? formatDisplayDateTime(item.deadlineIso) : 'Без срока'))
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
          <Text style={styles.addButtonText}>+ Добавить запись</Text>
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
              {editingId ? 'Редактировать запись' : 'Новая запись'}
            </Text>

            {/* Выбор типа: Задача / Событие / Пара */}
            <View style={styles.typeSelector}>
              {[
                { id: 'task', label: 'Задача' },
                { id: 'event', label: 'Событие' },
                { id: 'class', label: 'Пара' },
              ].map(t => (
                <TouchableOpacity 
                  key={t.id}
                  style={[styles.typeBtn, itemType === t.id && styles.typeBtnActive]}
                  onPress={() => setItemType(t.id)}
                >
                  <Text style={[styles.typeBtnText, itemType === t.id && styles.typeBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Название</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Бла-Бла-Бла"
              placeholderTextColor="#B0A8B9"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            {/* НАСТРОЙКИ ДЛЯ ЗАДАЧИ */}
            {itemType === 'task' && (
              <>
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

                <Text style={styles.inputLabel}>Приоритет</Text>
                <View style={styles.prioritySelector}>
                  {[
                    { id: 'high', label: 'Высокий', color: '#FF758F' },
                    { id: 'medium', label: 'Средний', color: '#FFB3C1' },
                    { id: 'low', label: 'Низкий', color: '#A3CECB' }
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
              </>
            )}

            {/* НАСТРОЙКИ ДЛЯ СОБЫТИЯ */}
            {itemType === 'event' && (
              <View>
                <Text style={styles.sectionSubTitle}>Начало события:</Text>
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Дата (ГГГГ-ММ-ДД)"
                      keyboardType="numeric"
                      maxLength={10}
                      value={formStartDate}
                      onChangeText={(txt) => handleDateMask(txt, setFormStartDate)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Время (ЧЧ:ММ)"
                      keyboardType="numeric"
                      maxLength={5}
                      value={formStartTime}
                      onChangeText={(txt) => handleTimeMask(txt, setFormStartTime)}
                    />
                  </View>
                </View>

                <Text style={styles.sectionSubTitle}>Конец события:</Text>
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Дата (ГГГГ-ММ-ДД)"
                      keyboardType="numeric"
                      maxLength={10}
                      value={formEndDate}
                      onChangeText={(txt) => handleDateMask(txt, setFormEndDate)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Время (ЧЧ:ММ)"
                      keyboardType="numeric"
                      maxLength={5}
                      value={formEndTime}
                      onChangeText={(txt) => handleTimeMask(txt, setFormEndTime)}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* НАСТРОЙКИ ДЛЯ ПАРЫ */}
            {itemType === 'class' && (
              <View>
                <Text style={styles.inputLabel}>Дата и время пары</Text>
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Дата (ГГГГ-ММ-ДД)"
                      keyboardType="numeric"
                      maxLength={10}
                      value={formClassDate}
                      onChangeText={(txt) => handleDateMask(txt, setFormClassDate)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Время (ЧЧ:ММ)"
                      keyboardType="numeric"
                      maxLength={5}
                      value={formClassTime}
                      onChangeText={(txt) => handleTimeMask(txt, setFormClassTime)}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Тип занятия</Text>
                <View style={styles.prioritySelector}>
                  {[
                    { id: 'lecture', label: 'Лекция', color: '#FDE047' },
                    { id: 'seminar', label: 'Семинар', color: '#FB923C' },
                    { id: 'practice', label: 'Практика', color: '#38BDF8' }
                  ].map(subtype => (
                    <TouchableOpacity
                      key={subtype.id}
                      style={[
                        styles.priorityBtn,
                        { backgroundColor: subtype.color },
                        formClassSubtype === subtype.id && styles.priorityBtnSelected
                      ]}
                      onPress={() => setFormClassSubtype(subtype.id)}
                    >
                      <Text style={[styles.priorityBtnText, { color: '#332E2E' }]}>{subtype.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              {editingId && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(editingId)}>
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
    paddingTop: 14,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A3E3D',
  },
  shareButton: {
    backgroundColor: '#FFB3C1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthNavBtn: {
    fontSize: 16,
    color: '#FF758F',
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A3E3D',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  weekDayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#A09090',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 48,
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    paddingTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellSelected: {
    borderColor: '#FF758F',
    backgroundColor: '#FFF0F3',
  },
  dayText: {
    fontSize: 12,
    color: '#4A3E3D',
    fontWeight: '600',
    marginBottom: 2,
  },
  dayTextSelected: {
    color: '#FF758F',
    fontWeight: '700',
  },
  stripesContainer: {
    width: '90%',
    gap: 2,
    alignItems: 'center',
  },
  stripe: {
    width: '100%',
  },
  moreStripesText: {
    fontSize: 8,
    color: '#A09090',
    fontWeight: 'bold',
    lineHeight: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A3E3D',
  },
  resetFilterText: {
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#8A7A7A',
  },
  emptySubText: {
    fontSize: 11,
    color: '#B0A8B9',
    marginTop: 2,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3E3D',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  badge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
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
    paddingVertical: 13,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#4A3E3D',
    marginBottom: 12,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeBtnActive: {
    backgroundColor: '#FF758F',
  },
  typeBtnText: {
    fontSize: 12,
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
    fontSize: 12,
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
    marginBottom: 14,
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

