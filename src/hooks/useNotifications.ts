
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import mockDatabaseService from '@/services/mockDatabase';

export interface Notification {
  id: string;
  type: 'blood_request' | 'inventory_added' | 'match_found' | 'hospital_contacted';
  title: string;
  message: string;
  hospitalName?: string;
  requestId?: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications(hospitalName?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast for new notifications
    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  // Poll for new blood requests and inventory changes
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const requests = await mockDatabaseService.getBloodRequests();
        const inventory = await mockDatabaseService.getBloodInventoryDetails();
        
        // Check for new requests that need AI matching
        const unprocessedRequests = requests.filter(req => req.matchPercentage === 0);
        
        unprocessedRequests.forEach(request => {
          if (hospitalName && request.hospital !== hospitalName) {
            // Notify other hospitals about new requests
            addNotification({
              type: 'blood_request',
              title: 'New Blood Request',
              message: `${request.hospital} needs ${request.bloodType} (${request.units} units)`,
              hospitalName: request.hospital,
              requestId: request.id
            });
          }
        });

      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [hospitalName]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead
  };
}
