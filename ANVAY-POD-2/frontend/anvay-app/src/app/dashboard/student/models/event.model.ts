export interface EventRecord {
  eventId?: number;
  title: string;   
  description: string;
  eventDate: string;   
  location: string;    
  type: string;        
  registeredCount: number; 
  totalCapacity: number;
  isRegistered?: boolean; 
}

export interface EventParticipant {
  id?: number;
  eventId: number;
  userId: number;
  status: string;
  createdAt?: string;
}