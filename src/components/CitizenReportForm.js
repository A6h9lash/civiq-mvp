import React, { useState } from 'react';
import { auth, db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CitizenReportForm() {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [message, setMessage] = useState('');

  const handleLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      let photoUrl = '';
      if (photo) {
        const storageRef = ref(storage, `reports/${Date.now()}_${photo.name}`);
        await uploadBytes(storageRef, photo);
        photoUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'issues'), {
        userId: user.uid,
        description,
        category,
        location,
        photoUrl,
        status: 'Submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setMessage('Report submitted successfully!');
      setDescription('');
      setCategory('');
      setPhoto(null);
    } catch (err) {
      console.error(err);
      setMessage('Error submitting report.');
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Report a Civic Issue</h2>
      <textarea placeholder="Describe the issue..." className="w-full p-2 border rounded mb-2" value={description} onChange={e => setDescription(e.target.value)} />
      <select className="w-full p-2 border rounded mb-2" value={category} onChange={e => setCategory(e.target.value)}>
        <option value="">Select category</option>
        <option value="Garbage">Garbage</option>
        <option value="Pothole">Pothole</option>
        <option value="Streetlight">Streetlight</option>
        <option value="Traffic Signal">Traffic Signal</option>
      </select>
      <input type="file" onChange={e => setPhoto(e.target.files[0])} className="mb-2" />
      <button onClick={handleLocation} className="px-4 py-2 bg-blue-500 text-white rounded mb-2">Fetch My Location</button>
      <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-2 rounded">Submit Report</button>
      {message && <p className="mt-2 text-center">{message}</p>}
    </div>
  );
}