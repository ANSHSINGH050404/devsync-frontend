import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';

const UserAuth = ({ children }) => {
  const { user, loading: userLoading } = useContext(UserContext); // Assume context provides loading state
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Access token inside useEffect to avoid SSR issues
    const token = localStorage.getItem('token');

    // If user context is still loading, wait
    if (userLoading) {
      return;
    }

    // Redirect to login if no token or no user
    if (!token || !user) {
      navigate('/login', { replace: true }); // Use replace to avoid adding to history
    } else {
      setLoading(false); // Authentication successful, render children
    }
  }, [user, userLoading, navigate]);

  if (loading || userLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default UserAuth;