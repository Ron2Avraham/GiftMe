import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Async thunk for fetching friends
export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Get user's connections
      const connectionsRef = collection(db, 'users', currentUser.uid, 'connections');
      const querySnapshot = await getDocs(connectionsRef);
      const friends = [];

      for (const doc of querySnapshot.docs) {
        const friendId = doc.id;
        const friendData = await getDoc(doc(db, 'users', friendId));
        if (friendData.exists()) {
          friends.push({
            id: friendId,
            ...friendData.data()
          });
        }
      }

      return friends;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const friendsSlice = createSlice({
  name: 'friends',
  initialState: {
    friends: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export default friendsSlice.reducer; 