import { useState } from 'react';
import { ArrowLeft, Edit2, Mail, User } from 'lucide-react';

interface UserProfileScreenProps {
  user: {
    name: string;
    avatar: string;
    email: string;
  };
  onBack: () => void;
  onUpdateProfile: (name: string, avatar: string) => void;
  onLogout: () => void;
}

const avatarColors = [
  'bg-red-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-yellow-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-indigo-400',
  'bg-orange-400',
];

export function UserProfileScreen({ user, onBack, onUpdateProfile, onLogout }: UserProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar);

  const handleSave = () => {
    if (editName.trim()) {
      onUpdateProfile(editName, editAvatar);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(user.name);
    setEditAvatar(user.avatar);
    setIsEditing(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl">Profile</h1>
        <button onClick={() => setIsEditing(!isEditing)}>
          <Edit2 className="w-6 h-6" />
        </button>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Avatar Section */}
        <div className="bg-white py-8 flex flex-col items-center border-b border-gray-200">
          <div className={`w-24 h-24 ${isEditing ? editAvatar : user.avatar} rounded-full flex items-center justify-center text-white text-3xl mb-4`}>
            {(isEditing ? editName : user.name).charAt(0).toUpperCase()}
          </div>
          
          {isEditing && (
            <div className="flex gap-2 flex-wrap justify-center mb-4">
              {avatarColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setEditAvatar(color)}
                  className={`w-10 h-10 ${color} rounded-full ${
                    editAvatar === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-white mt-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3 text-gray-500 mb-1">
              <User className="w-5 h-5" />
              <span className="text-sm">Name</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="ml-8">{user.name}</p>
            )}
          </div>

          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3 text-gray-500 mb-1">
              <Mail className="w-5 h-5" />
              <span className="text-sm">Email</span>
            </div>
            <p className="ml-8 text-gray-700">{user.email}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="px-4 mt-4 space-y-2">
            <button
              onClick={handleSave}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="px-4 mt-4">
          <button
            onClick={onLogout}
            className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}