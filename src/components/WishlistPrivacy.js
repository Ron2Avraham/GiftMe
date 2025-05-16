import React, { useState } from 'react';
import './WishlistPrivacy.scss';

const WishlistPrivacy = ({ onSave, initialSettings }) => {
  const [settings, setSettings] = useState(initialSettings || {
    visibility: 'private', // private, friends, public
    password: '',
    allowComments: false,
    showPrice: true,
    showPurchaseStatus: false,
    shareWithSpouse: true,
    notifyOnView: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(settings);
    setIsEditing(false);
  };

  return (
    <div className="wishlist-privacy">
      <div className="privacy-header">
        <h3>Privacy Settings</h3>
        <button 
          className={`edit-btn ${isEditing ? 'active' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="privacy-settings">
        <div className="setting-group">
          <label>Visibility</label>
          <select 
            value={settings.visibility}
            onChange={(e) => handleChange('visibility', e.target.value)}
            disabled={!isEditing}
          >
            <option value="private">Private - Only you can see</option>
            <option value="friends">Friends - Only your connections can see</option>
            <option value="public">Public - Anyone can see</option>
          </select>
        </div>

        <div className="setting-group">
          <label>Password Protection</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              value={settings.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Set a password (optional)"
              disabled={!isEditing}
            />
            <button 
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              disabled={!isEditing}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Sharing Options</label>
          <div className="checkbox-group">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.shareWithSpouse}
                onChange={(e) => handleChange('shareWithSpouse', e.target.checked)}
                disabled={!isEditing}
              />
              Share with spouse
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.allowComments}
                onChange={(e) => handleChange('allowComments', e.target.checked)}
                disabled={!isEditing}
              />
              Allow comments
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.notifyOnView}
                onChange={(e) => handleChange('notifyOnView', e.target.checked)}
                disabled={!isEditing}
              />
              Notify when someone views
            </label>
          </div>
        </div>

        <div className="setting-group">
          <label>Display Options</label>
          <div className="checkbox-group">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.showPrice}
                onChange={(e) => handleChange('showPrice', e.target.checked)}
                disabled={!isEditing}
              />
              Show prices
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.showPurchaseStatus}
                onChange={(e) => handleChange('showPurchaseStatus', e.target.checked)}
                disabled={!isEditing}
              />
              Show purchase status
            </label>
          </div>
        </div>

        {isEditing && (
          <div className="actions">
            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPrivacy; 