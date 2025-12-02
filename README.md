# SaaS Workspace (Minu)

A comprehensive SaaS web application combining ClickUp + Google Drive + Slack features into one powerful workspace. Built with Next.js 14, Firebase, TypeScript, and TailwindCSS.

## 🚀 Features

### Authentication
- Email/Password authentication
- Google OAuth integration
- Password reset / Forgot password
- Role-based access control (Owner, Admin, Member, Viewer)
- Team invitations via email
- User onboarding wizard

### Team Management
- Create and manage teams
- Invite team members with role assignment
- View and manage pending invitations
- Remove team members
- Activity logs
- Team creation dialog

### Project & Task Management (ClickUp-style)
- Kanban board with drag-and-drop functionality
- Multiple task statuses (Todo, In Progress, In Review, Done)
- Task priorities (Low, Medium, High, Urgent)
- Task assignments with multiple assignees
- Due dates and time tracking
- Task comments and watchers
- Task filters (status, priority, assignee, tags)
- Real-time updates

### File Manager (Google Drive-style)
- File upload with drag-and-drop
- Folder creation and organization
- Grid and list view modes
- File preview for images, videos, PDFs, and documents
- File sharing with team members (share dialog)
- File search functionality
- Rename, move, and delete operations
- Firebase Storage integration

### Real-time Chat (Slack-style)
- Public and private channels
- Direct messages (1:1)
- Real-time messaging
- Message reactions with emojis
- Typing indicators
- Message editing and deletion
- File attachments
- Unread message counts

### Notifications
- In-app notification center
- Toast notifications system
- Email notifications via Cloud Functions
- Notification types:
  - Task assigned
  - Task comments
  - Task due reminders
  - File shared
  - Team invitations
  - Mentions
  - Project updates
- Weekly digest emails

### User Experience
- Command Palette (Ctrl+K) for quick navigation
- Keyboard shortcuts dialog (Ctrl+/)
- Global search functionality
- Dark/Light mode theming
- Responsive design
- Onboarding wizard for new users

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, Shadcn UI components
- **State Management**: Zustand
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **File Storage**: Firebase Storage
- **Cloud Functions**: Firebase Cloud Functions
- **Drag & Drop**: react-dnd with HTML5 backend
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📁 Project Structure

```
saas-workspace/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── dashboard/         # Main dashboard pages
│   │   │   ├── chat/
│   │   │   ├── files/
│   │   │   ├── notifications/
│   │   │   ├── projects/
│   │   │   │   └── [id]/
│   │   │   ├── settings/
│   │   │   └── team/
│   │   └── invite/            # Invitation acceptance
│   │       └── [id]/
│   ├── components/
│   │   ├── chat/              # Chat components
│   │   ├── layout/            # Layout components
│   │   ├── projects/          # Project/task components
│   │   └── ui/                # Shadcn UI components
│   ├── lib/
│   │   ├── firebase/          # Firebase services
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   ├── config.ts
│   │   │   ├── files.ts
│   │   │   ├── notifications.ts
│   │   │   ├── projects.ts
│   │   │   └── teams.ts
│   │   └── utils.ts
│   ├── stores/                # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── chat-store.ts
│   │   ├── file-store.ts
│   │   ├── notification-store.ts
│   │   └── project-store.ts
│   └── types/                 # TypeScript types
│       └── index.ts
├── functions/                  # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── firebase.json              # Firebase configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
└── storage.rules              # Storage security rules
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd saas-workspace
```

2. Install dependencies:
```bash
npm install
cd functions && npm install && cd ..
```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config

4. Configure environment variables:
   Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

5. Deploy Firestore rules and indexes:
```bash
firebase deploy --only firestore
firebase deploy --only storage
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Firebase Emulators (Optional)

For local development with Firebase emulators:

```bash
firebase emulators:start
```

Then update your Firebase config to use emulators (already configured in `src/lib/firebase/config.ts`).

### Deploying Cloud Functions

1. Configure SMTP settings for email notifications:
```bash
firebase functions:config:set smtp.host="smtp.gmail.com" smtp.port="587" smtp.user="your-email@gmail.com" smtp.password="your-app-password" smtp.from="Your App <noreply@yourapp.com>"
firebase functions:config:set app.url="https://your-app-url.com"
```

2. Deploy functions:
```bash
cd functions
npm run build
firebase deploy --only functions
```

## 📱 Usage

### Creating a Team
1. Sign up or log in
2. Click on the team selector in the sidebar
3. Create a new team with a name and description
4. Invite team members via email

### Managing Projects
1. Navigate to Projects from the sidebar
2. Create a new project with a name and description
3. Click on a project to view its Kanban board
4. Drag and drop tasks between columns
5. Click on a task to edit details, add comments, or assign team members

### File Management
1. Navigate to Files from the sidebar
2. Upload files via drag-and-drop or the upload button
3. Create folders to organize files
4. Click on a file to preview it
5. Use the menu to rename, share, or delete files

### Chat
1. Navigate to Chat from the sidebar
2. Create channels for team discussions
3. Start direct messages with team members
4. React to messages with emojis
5. Share files in chat

## 🔒 Security

- All routes are protected with authentication
- Firestore security rules enforce role-based access
- Storage rules limit file uploads to 50MB
- Team data is isolated between teams

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for the beautiful components
- [Firebase](https://firebase.google.com/) for the backend infrastructure
- [react-dnd](https://react-dnd.github.io/react-dnd/) for drag and drop
- [Lucide](https://lucide.dev/) for the icons
