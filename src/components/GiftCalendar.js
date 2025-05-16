import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './GiftCalendar.scss';

const GiftCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [wishlistItems, setWishlistItems] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'birthday',
    reminder: true,
    description: '',
    budget: '',
    giftIdeas: [],
    linkedWishlistItem: null
  });

  const eventTypes = [
    { id: 'birthday', label: 'Birthday', icon: '🎂' },
    { id: 'anniversary', label: 'Anniversary', icon: '💑' },
    { id: 'holiday', label: 'Holiday', icon: '🎄' },
    { id: 'custom', label: 'Custom', icon: '📅' }
  ];

  useEffect(() => {
    loadEvents();
    loadWishlistItems();
    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Please sign in to view your calendar'
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const eventsRef = collection(db, 'users', currentUser.uid, 'calendar');
      const snapshot = await getDocs(eventsRef);
      
      // Add console.log to debug the data
      console.log('Raw events data:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const loadedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure date is properly formatted
        return {
          id: doc.id,
          ...data,
          date: data.date ? new Date(data.date).toISOString() : null
        };
      }).filter(event => event.date !== null); // Filter out any events with invalid dates

      console.log('Processed events:', loadedEvents);
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Failed to load events. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWishlistItems = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // Get the user's partner ID from their profile
      const userDoc = await getDocs(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      const partnerId = userData?.partnerId;

      if (!partnerId) {
        console.log('No partner connected');
        return;
      }

      // Get partner's wishlist items
      const wishlistRef = collection(db, 'users', partnerId, 'wishlist');
      const snapshot = await getDocs(wishlistRef);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist items:', error);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Failed to load wishlist items'
      }]);
    }
  };

  const checkUpcomingEvents = () => {
    const now = new Date();
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      const timeDiff = eventDate - now;
      const daysUntilEvent = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      return daysUntilEvent >= 0 && daysUntilEvent <= 7; // Events in next 7 days
    });

    if (upcomingEvents.length > 0) {
      const newNotifications = upcomingEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        type: 'upcoming',
        message: `${event.title} is coming up in ${Math.ceil((new Date(event.date) - now) / (1000 * 60 * 60 * 24))} days!`
      }));
      setNotifications(prev => [...newNotifications, ...prev]);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Please fill in all required fields.'
      }]);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Please sign in to add events.'
      }]);
      return;
    }

    try {
      const formattedDate = new Date(newEvent.date).toISOString();
      
      const eventData = {
        title: newEvent.title.trim(),
        date: formattedDate,
        type: newEvent.type || 'custom',
        reminder: Boolean(newEvent.reminder),
        description: newEvent.description?.trim() || '',
        budget: newEvent.budget?.trim() || '',
        giftIdeas: Array.isArray(newEvent.giftIdeas) ? newEvent.giftIdeas : [],
        linkedWishlistItem: newEvent.linkedWishlistItem,
        createdAt: new Date().toISOString(),
        userId: currentUser.uid
      };

      const eventsRef = collection(db, 'users', currentUser.uid, 'calendar');
      const docRef = await addDoc(eventsRef, eventData);

      setEvents([...events, { id: docRef.id, ...eventData }]);
      setNewEvent({
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: 'birthday',
        reminder: true,
        description: '',
        budget: '',
        giftIdeas: [],
        linkedWishlistItem: null
      });
      setIsAddingEvent(false);

      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        message: 'Event added successfully!'
      }]);
    } catch (error) {
      console.error('Error adding event:', error);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: error.message || 'Failed to add event. Please try again.'
      }]);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'calendar', eventId));
      setEvents(events.filter(event => event.id !== eventId));
      
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        message: 'Event deleted successfully!'
      }]);
    } catch (error) {
      console.error('Error deleting event:', error);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Failed to delete event. Please try again.'
      }]);
    }
  };

  const removeNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const tileContent = ({ date }) => {
    const eventsForDate = getEventsForDate(date);
    if (eventsForDate.length > 0) {
      return (
        <div className="calendar-event-dot">
          {eventsForDate.map(event => (
            <span 
              key={event.id} 
              className={`event-dot ${event.type}`}
              title={event.title}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setNewEvent(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
  };

  const handleDateInputChange = (e) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setSelectedDate(date);
      setNewEvent(prev => ({
        ...prev,
        date: e.target.value
      }));
    }
  };

  return (
    <div className="gift-calendar-page">
      <div className="notifications">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            <span className="notification-message">{notification.message}</span>
            <button className="notification-close">×</button>
          </div>
        ))}
      </div>

      <div className="gift-calendar">
        <div className="calendar-header">
          <div className="header-content">
            <h3>Gift Calendar</h3>
            <p className="header-description">Keep track of important dates and gift-giving occasions</p>
          </div>
          <button 
            className="add-event-btn"
            onClick={() => {
              setIsAddingEvent(true);
              setNewEvent(prev => ({
                ...prev,
                date: selectedDate.toISOString().split('T')[0]
              }));
            }}
          >
            <span className="plus-icon">+</span>
            Add New Event
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your events...</p>
          </div>
        ) : (
          <>
            <div className="calendar-container">
              <Calendar
                onChange={handleDateSelect}
                value={selectedDate}
                tileContent={tileContent}
                className="gift-calendar-view"
              />
            </div>

            {isAddingEvent && (
              <div className="add-event-form">
                <div className="form-header">
                  <h4>Add New Event</h4>
                  <button 
                    className="close-form-btn"
                    onClick={() => setIsAddingEvent(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g., Mom's Birthday"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={handleDateInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  >
                    {eventTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Budget</label>
                  <input
                    type="text"
                    value={newEvent.budget}
                    onChange={(e) => setNewEvent({ ...newEvent, budget: e.target.value })}
                    placeholder="e.g., $50-100"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Add any notes or gift ideas..."
                  />
                </div>

                <div className="form-group">
                  <label>Link to Wishlist Item</label>
                  <select
                    value={newEvent.linkedWishlistItem || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, linkedWishlistItem: e.target.value || null })}
                  >
                    <option value="">Select a wishlist item</option>
                    {wishlistItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - ${item.price}
                      </option>
                    ))}
                  </select>
                  {wishlistItems.length === 0 && (
                    <p className="form-help-text">
                      No wishlist items available. Make sure your partner has added items to their wishlist.
                    </p>
                  )}
                </div>

                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={newEvent.reminder}
                      onChange={(e) => setNewEvent({ ...newEvent, reminder: e.target.checked })}
                    />
                    Set Reminder
                  </label>
                </div>

                <div className="form-actions">
                  <button className="cancel-btn" onClick={() => setIsAddingEvent(false)}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={handleAddEvent}>
                    Save Event
                  </button>
                </div>
              </div>
            )}

            <div className="upcoming-events">
              <h4>Events for {selectedDate.toLocaleDateString()}</h4>
              {getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map(event => {
                  const linkedItem = event.linkedWishlistItem 
                    ? wishlistItems.find(item => item.id === event.linkedWishlistItem)
                    : null;

                  return (
                    <div key={event.id} className="event-card">
                      <div className="event-header">
                        <span className="event-icon">
                          {eventTypes.find(type => type.id === event.type)?.icon}
                        </span>
                        <h5>{event.title}</h5>
                        <span className="event-date">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                      
                      {event.budget && (
                        <p className="event-budget">Budget: {event.budget}</p>
                      )}

                      {linkedItem && (
                        <div className="linked-wishlist-item">
                          <h6>Linked Wishlist Item:</h6>
                          <div className="wishlist-item-preview">
                            <img 
                              src={linkedItem.image} 
                              alt={linkedItem.name}
                              className="wishlist-item-image"
                            />
                            <div className="wishlist-item-details">
                              <p className="item-name">{linkedItem.name}</p>
                              <p className="item-price">${linkedItem.price}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="event-actions">
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-events">
                  <p>No events for this date. Add some to get started!</p>
                  <button 
                    className="add-first-event-btn"
                    onClick={() => {
                      setIsAddingEvent(true);
                      setNewEvent(prev => ({
                        ...prev,
                        date: selectedDate.toISOString().split('T')[0]
                      }));
                    }}
                  >
                    Add Event
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GiftCalendar; 