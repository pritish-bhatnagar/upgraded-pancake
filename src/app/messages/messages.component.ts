import { Component } from '@angular/core';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider } from 'src/app/firebase/firebase-config';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent {
  db = getFirestore();
  user: User | null = null;
  message = '';
  messages: any[] = [];
  senderUserId: string;
  sentMessages: any;
  recievedMessages: any =[];

  constructor() {
    this.listenToAuth();
  }

  login() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((err) =>
      console.error('Login error:', err)
    );
  }

  listenToAuth() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.senderUserId = user.uid;
      this.listenToMessages('AIT4p75yKiTvbwz1F6P9BtGSbw92');
    });
  }

  sendMessage(receiverUserId) {
    if (!this.user || !this.message.trim()) return;

    const msg = {
      text: this.message,
      uid: this.user.uid,
      displayName: this.user.displayName,
      timestamp: serverTimestamp(),
    };

    addDoc(
      collection(this.db, 'messages', this.senderUserId, receiverUserId),
      msg
    )
      .then(() => (this.message = ''))
      .catch((err) => console.error('Send error:', err));
  }

  async listenToMessages(receiverUserId) {
    const currentUser = auth.currentUser;
    let allMessages: any[] = [];
    console.log(receiverUserId);
    if (currentUser && receiverUserId) {
      console.log('called');
      const sentMessagesRef = collection(
        this.db,
        'messages',
        currentUser.uid,
        receiverUserId
      );
      const receivedMessagesRef = collection(
        this.db,
        'messages',
        receiverUserId,
        currentUser.uid
      );
      console.log(
        'messages',
        
        currentUser.uid,receiverUserId,)
      console.log(
        'messages',
        receiverUserId,
        currentUser.uid)

      const sentQuery = query(sentMessagesRef, orderBy('timestamp', 'asc'));
      const receivedQuery = query(
        receivedMessagesRef,
        orderBy('timestamp', 'asc')
      );
      onSnapshot(sentQuery, (snapshot) => {
        console.log("called 1")
         this.sentMessages  =  snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      });

      onSnapshot(receivedQuery, (snapshot) => {
        console.log("called 2")
        console.log(this.messages )
        this.recievedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        this.messages=[...this.recievedMessages,...this.sentMessages]
      });
      const test = await this.recievedMessages
if(test){
  console.log("calledqqqqq")
}
      // this.messages = this.sentMessages;
      this.messages.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return a.timestamp.seconds - b.timestamp.seconds;
      });
    }
  }
}
