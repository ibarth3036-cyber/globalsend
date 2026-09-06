import { Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiPhone, FiMapPin, FiEdit2, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) {
    return null;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="profile-page">
          <div className="profile-header-card">
            <div className="profile-avatar">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {profile.first_name[0]}{profile.last_name[0]}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h1>{profile.first_name} {profile.last_name}</h1>
              <p className="profile-role">{profile.role}</p>
              <div className="profile-details">
                <span>
                  <FiMail size={14} /> {profile.email}
                </span>
                {profile.phone && (
                  <span>
                    <FiPhone size={14} /> {profile.phone}
                  </span>
                )}
                {profile.location && (
                  <span>
                    <FiMapPin size={14} /> {profile.location}
                  </span>
                )}
                <span>
                  Currency: {profile.preferred_currency || 'USD'}
                </span>
              </div>
              <div className="profile-verification">
                <span className={profile.id_verified ? 'verified' : 'unverified'}>
                  {profile.id_verified ? (
                    <>
                      <FiCheckCircle /> ID Verified
                    </>
                  ) : (
                    <>
                      <FiXCircle /> ID Not Verified
                    </>
                  )}
                </span>
                <span className={profile.is_active ? 'verified' : 'unverified'}>
                  {profile.is_active ? (
                    <>
                      <FiCheckCircle /> Active
                    </>
                  ) : (
                    <>
                      <FiXCircle /> Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
            <Link to="/settings" className="btn btn-outline">
              <FiEdit2 size={16} /> Edit Profile
            </Link>
          </div>

          {profile.id_card_front && (
            <div className="id-cards-section">
              <h3>ID Cards</h3>
              <div className="id-cards-grid">
                <div className="id-card">
                  <label>Front</label>
                  <img src={profile.id_card_front} alt="ID Front" />
                </div>
                {profile.id_card_back && (
                  <div className="id-card">
                    <label>Back</label>
                    <img src={profile.id_card_back} alt="ID Back" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
