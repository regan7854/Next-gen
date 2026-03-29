// Dummy data for notifications
export const dummyNotifications = [
  {
    id: 1,
    type: "collaboration",
    title: "New Collaboration Opportunity",
    description: "TechBrand Co. invited you to collaborate on an AI marketing campaign",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    icon: "handshake"
  },
  {
    id: 2,
    type: "comment",
    title: "New Comment on Your Post",
    description: "Sarah Johnson commented: 'This is an amazing insight!'",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: false,
    icon: "message"
  },
  {
    id: 3,
    type: "trending",
    title: "Trending Alert",
    description: "Your content about 'Sustainable Fashion' is trending!",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: false,
    icon: "trending"
  },
  {
    id: 4,
    type: "follower",
    title: "New Follower",
    description: "Alex Chen started following you",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    icon: "user"
  },
  {
    id: 5,
    type: "milestone",
    title: "Milestone Achievement",
    description: "Congratulations! You reached 5,000 followers",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    icon: "star"
  },
  {
    id: 6,
    type: "system",
    title: "Account Update",
    description: "Your profile verification is complete",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
    icon: "check"
  }
];
