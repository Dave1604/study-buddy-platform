const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Course = require('./models/Course');
const Quiz = require('./models/Quiz');
const Progress = require('./models/Progress');

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Sample data
const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    await Progress.deleteMany({});

    // Create users
    console.log('👤 Creating users...');
    const students = await User.create([
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'student@example.com',
        password: 'password123',
        role: 'student',
        bio: 'Passionate learner interested in programming and design'
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        password: 'password123',
        role: 'student',
        bio: 'Data science enthusiast'
      }
    ]);

    const instructors = await User.create([
      {
        firstName: 'Dr. Sarah',
        lastName: 'Williams',
        email: 'instructor@example.com',
        password: 'password123',
        role: 'instructor',
        bio: 'Computer Science professor with 10+ years of experience'
      },
      {
        firstName: 'John',
        lastName: 'Davis',
        email: 'john.davis@example.com',
        password: 'password123',
        role: 'instructor',
        bio: 'Web development expert and tech educator'
      }
    ]);

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      bio: 'Platform administrator'
    });

    console.log('✅ Users created');

    // Create courses
    console.log('📚 Creating courses...');
    const courses = await Course.create([
      {
        title: 'Introduction to JavaScript',
        description: 'Learn the fundamentals of JavaScript programming language. Master variables, functions, loops, and object-oriented programming concepts.',
        shortDescription: 'Master JavaScript basics and build interactive web applications',
        instructor: instructors[1]._id,
        category: 'programming',
        level: 'beginner',
        thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
        videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
        learningObjectives: [
          'Understand JavaScript syntax and fundamentals',
          'Work with variables, data types, and operators',
          'Master functions and control flow',
          'Build interactive web applications',
          'Understand DOM manipulation'
        ],
        prerequisites: ['Basic HTML and CSS knowledge'],
        tags: ['javascript', 'programming', 'web development'],
        lessons: [
          {
            title: 'Introduction to JavaScript',
            content: 'JavaScript is a versatile programming language that powers the modern web. In this lesson, we will explore what JavaScript is, its history, and why it\'s essential for web development.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
            duration: 100,
            order: 1
          },
          {
            title: 'Variables and Data Types',
            content: 'Learn about variables, constants, and different data types in JavaScript including strings, numbers, booleans, objects, and arrays.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=9emXNzqCKyg',
            duration: 45,
            order: 2
          },
          {
            title: 'Functions and Scope',
            content: 'Master functions, arrow functions, parameters, return values, and understand scope and closure concepts.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=N8ap4k_1QEQ',
            duration: 60,
            order: 3
          },
          {
            title: 'Control Flow and Loops',
            content: 'Learn about if/else statements, switch cases, for loops, while loops, and array iteration methods.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=s9wW2PpJsmQ',
            duration: 50,
            order: 4
          },
          {
            title: 'DOM Manipulation',
            content: 'Understand the Document Object Model and learn how to manipulate HTML elements using JavaScript.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=y17RuWkWdn8',
            duration: 75,
            order: 5
          }
        ],
        isPublished: true,
        estimatedDuration: 330
      },
      {
        title: 'React for Beginners',
        description: 'Build modern web applications with React. Learn components, state management, hooks, and best practices for creating scalable React applications.',
        shortDescription: 'Build modern web apps with React and hooks',
        instructor: instructors[1]._id,
        category: 'programming',
        level: 'intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
        videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
        learningObjectives: [
          'Understand React components and JSX',
          'Master React hooks and state management',
          'Build reusable component libraries',
          'Handle forms and user input',
          'Create single-page applications'
        ],
        prerequisites: ['JavaScript fundamentals', 'ES6 features'],
        tags: ['react', 'javascript', 'frontend'],
        lessons: [
          {
            title: 'Getting Started with React',
            content: 'Introduction to React, setting up development environment, and creating your first React app.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
            duration: 90,
            order: 1
          },
          {
            title: 'Components and Props',
            content: 'Learn about functional and class components, JSX syntax, and passing data with props.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=RVFAyFWO4go',
            duration: 60,
            order: 2
          },
          {
            title: 'State and Lifecycle',
            content: 'Understanding component state, useState hook, and component lifecycle.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
            duration: 75,
            order: 3
          },
          {
            title: 'Handling Events',
            content: 'Learn how to handle user interactions and events in React applications.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=1ncdVkqmfdo',
            duration: 45,
            order: 4
          }
        ],
        isPublished: true,
        estimatedDuration: 270
      },
      {
        title: 'Data Structures and Algorithms',
        description: 'Master fundamental data structures and algorithms. Learn to solve complex problems efficiently and prepare for technical interviews.',
        shortDescription: 'Master DSA and ace technical interviews',
        instructor: instructors[0]._id,
        category: 'programming',
        level: 'intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
        videoUrl: 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
        learningObjectives: [
          'Understand time and space complexity',
          'Master arrays, linked lists, and trees',
          'Implement sorting and searching algorithms',
          'Solve algorithmic problems',
          'Prepare for coding interviews'
        ],
        prerequisites: ['Basic programming knowledge', 'Understanding of loops and functions'],
        tags: ['algorithms', 'data structures', 'problem solving'],
        lessons: [
          {
            title: 'Introduction to Algorithms',
            content: 'Understanding algorithmic thinking, Big O notation, and complexity analysis.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
            duration: 120,
            order: 1
          },
          {
            title: 'Arrays and Strings',
            content: 'Common array operations, two-pointer technique, and string manipulation.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=8hly31xKli0',
            duration: 90,
            order: 2
          },
          {
            title: 'Linked Lists',
            content: 'Singly and doubly linked lists, operations, and common problems.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=njTh_OwMljA',
            duration: 105,
            order: 3
          }
        ],
        isPublished: true,
        estimatedDuration: 315
      },
      {
        title: 'UI/UX Design Fundamentals',
        description: 'Learn the principles of user interface and user experience design. Create beautiful, user-friendly designs that convert.',
        shortDescription: 'Create beautiful and user-friendly interfaces',
        instructor: instructors[0]._id,
        category: 'design',
        level: 'beginner',
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
        videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
        learningObjectives: [
          'Understand design principles and theory',
          'Master color theory and typography',
          'Create user-centered designs',
          'Conduct user research and testing',
          'Build interactive prototypes'
        ],
        prerequisites: ['Basic computer skills'],
        tags: ['ui', 'ux', 'design', 'figma'],
        lessons: [
          {
            title: 'Introduction to UI/UX',
            content: 'What is UI/UX design and why it matters for digital products.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
            duration: 60,
            order: 1
          },
          {
            title: 'Design Principles',
            content: 'Learn about balance, contrast, hierarchy, and other fundamental principles.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=a91F4z8iPNw',
            duration: 75,
            order: 2
          }
        ],
        isPublished: true,
        estimatedDuration: 135
      },
      {
        title: 'Python for Data Science',
        description: 'Learn Python programming for data analysis and machine learning. Work with pandas, numpy, and visualization libraries.',
        shortDescription: 'Analyze data and build ML models with Python',
        instructor: instructors[0]._id,
        category: 'science',
        level: 'intermediate',
        learningObjectives: [
          'Master Python programming basics',
          'Work with pandas and numpy',
          'Visualize data effectively',
          'Perform statistical analysis',
          'Introduction to machine learning'
        ],
        prerequisites: ['Basic programming knowledge'],
        tags: ['python', 'data science', 'machine learning'],
        lessons: [
          {
            title: 'Python Basics',
            content: 'Introduction to Python syntax, data types, and control structures.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
            duration: 240,
            order: 1
          },
          {
            title: 'NumPy Fundamentals',
            content: 'Working with arrays, mathematical operations, and broadcasting.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=QUT1VHiLmmI',
            duration: 90,
            order: 2
          },
          {
            title: 'Pandas for Data Analysis',
            content: 'DataFrames, data cleaning, and manipulation techniques.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
            duration: 120,
            order: 3
          }
        ],
        isPublished: true,
        estimatedDuration: 450
      },
      {
        title: 'Web Development Bootcamp',
        description: 'Complete web development course covering HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build real-world projects and become a full-stack developer.',
        shortDescription: 'Master full-stack web development from scratch',
        instructor: instructors[0]._id,
        category: 'programming',
        level: 'beginner',
        thumbnail: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800',
        videoUrl: 'https://www.youtube.com/watch?v=zJSY8tbfBzQ',
        learningObjectives: [
          'Build responsive websites with HTML and CSS',
          'Create interactive web applications with JavaScript',
          'Develop full-stack applications with React and Node.js',
          'Work with databases and APIs',
          'Deploy applications to the cloud'
        ],
        prerequisites: ['Basic computer skills'],
        tags: ['web development', 'full-stack', 'javascript', 'react', 'nodejs'],
        lessons: [
          {
            title: 'HTML Fundamentals',
            content: 'Learn the structure and syntax of HTML, create semantic markup, and understand web standards.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
            duration: 120,
            order: 1
          },
          {
            title: 'CSS Styling and Layout',
            content: 'Master CSS selectors, properties, flexbox, grid, and responsive design principles.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
            duration: 150,
            order: 2
          },
          {
            title: 'JavaScript ES6+',
            content: 'Modern JavaScript features including arrow functions, destructuring, modules, and async/await.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=WZ1c1sWlMf8',
            duration: 180,
            order: 3
          },
          {
            title: 'React Development',
            content: 'Build dynamic user interfaces with React components, hooks, and state management.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=DLX62G4lc44',
            duration: 200,
            order: 4
          },
          {
            title: 'Node.js Backend',
            content: 'Create server-side applications with Node.js, Express, and RESTful APIs.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
            duration: 160,
            order: 5
          }
        ],
        isPublished: true,
        estimatedDuration: 810
      },
      {
        title: 'Machine Learning with Python',
        description: 'Learn machine learning algorithms, data preprocessing, model training, and deployment using Python and popular ML libraries.',
        shortDescription: 'Master machine learning from theory to practice',
        instructor: instructors[0]._id,
        category: 'science',
        level: 'intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
        videoUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0',
        learningObjectives: [
          'Understand machine learning concepts and algorithms',
          'Preprocess and analyze data for ML models',
          'Implement supervised and unsupervised learning',
          'Evaluate and optimize model performance',
          'Deploy ML models to production'
        ],
        prerequisites: ['Python programming basics', 'Basic statistics knowledge'],
        tags: ['machine learning', 'python', 'data science', 'AI', 'scikit-learn'],
        lessons: [
          {
            title: 'Introduction to Machine Learning',
            content: 'Overview of ML concepts, types of learning, and the ML workflow.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0',
            duration: 90,
            order: 1
          },
          {
            title: 'Data Preprocessing',
            content: 'Data cleaning, feature engineering, and preparation for ML algorithms.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
            duration: 120,
            order: 2
          },
          {
            title: 'Supervised Learning',
            content: 'Linear regression, decision trees, random forests, and SVM algorithms.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
            duration: 150,
            order: 3
          },
          {
            title: 'Unsupervised Learning',
            content: 'Clustering algorithms, dimensionality reduction, and anomaly detection.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
            duration: 120,
            order: 4
          }
        ],
        isPublished: true,
        estimatedDuration: 480
      },
      {
        title: 'Digital Marketing Mastery',
        description: 'Comprehensive digital marketing course covering SEO, social media, content marketing, email campaigns, and analytics.',
        shortDescription: 'Master digital marketing strategies and tools',
        instructor: instructors[1]._id,
        category: 'business',
        level: 'beginner',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        videoUrl: 'https://www.youtube.com/watch?v=7kVeCqQCxlk',
        learningObjectives: [
          'Develop effective digital marketing strategies',
          'Master SEO and content marketing techniques',
          'Create engaging social media campaigns',
          'Analyze marketing performance with analytics',
          'Build and manage email marketing campaigns'
        ],
        prerequisites: ['Basic business knowledge'],
        tags: ['digital marketing', 'SEO', 'social media', 'content marketing', 'analytics'],
        lessons: [
          {
            title: 'Digital Marketing Fundamentals',
            content: 'Introduction to digital marketing channels, strategies, and best practices.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=7kVeCqQCxlk',
            duration: 90,
            order: 1
          },
          {
            title: 'SEO and Content Marketing',
            content: 'Search engine optimization, keyword research, and content strategy.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=7kVeCqQCxlk',
            duration: 120,
            order: 2
          },
          {
            title: 'Social Media Marketing',
            content: 'Platform-specific strategies for Facebook, Instagram, LinkedIn, and Twitter.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=7kVeCqQCxlk',
            duration: 100,
            order: 3
          },
          {
            title: 'Email Marketing and Analytics',
            content: 'Email campaign design, automation, and performance measurement.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=7kVeCqQCxlk',
            duration: 80,
            order: 4
          }
        ],
        isPublished: true,
        estimatedDuration: 390
      },
      {
        title: 'Mobile App Development',
        description: 'Learn to build native and cross-platform mobile applications using React Native, Flutter, and modern development tools.',
        shortDescription: 'Build mobile apps for iOS and Android',
        instructor: instructors[1]._id,
        category: 'programming',
        level: 'intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
        videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eTPoc',
        learningObjectives: [
          'Build cross-platform mobile applications',
          'Master React Native and Flutter frameworks',
          'Implement mobile UI/UX best practices',
          'Handle mobile app state management',
          'Deploy apps to app stores'
        ],
        prerequisites: ['JavaScript fundamentals', 'Basic React knowledge'],
        tags: ['mobile development', 'react native', 'flutter', 'iOS', 'Android'],
        lessons: [
          {
            title: 'Introduction to Mobile Development',
            content: 'Overview of mobile development approaches, native vs cross-platform.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eTPoc',
            duration: 60,
            order: 1
          },
          {
            title: 'React Native Basics',
            content: 'Setting up React Native, components, navigation, and styling.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eTPoc',
            duration: 120,
            order: 2
          },
          {
            title: 'Flutter Development',
            content: 'Building apps with Flutter, widgets, state management, and navigation.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eTPoc',
            duration: 150,
            order: 3
          },
          {
            title: 'App Store Deployment',
            content: 'Publishing apps to Google Play Store and Apple App Store.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eTPoc',
            duration: 90,
            order: 4
          }
        ],
        isPublished: true,
        estimatedDuration: 420
      },
      {
        title: 'Cybersecurity Fundamentals',
        description: 'Learn essential cybersecurity concepts, threat analysis, network security, and ethical hacking techniques.',
        shortDescription: 'Protect systems and data from cyber threats',
        instructor: instructors[0]._id,
        category: 'science',
        level: 'intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
        videoUrl: 'https://www.youtube.com/watch?v=inWWhr5tnEA',
        learningObjectives: [
          'Understand cybersecurity threats and vulnerabilities',
          'Implement network security measures',
          'Conduct security assessments and penetration testing',
          'Develop secure coding practices',
          'Create incident response plans'
        ],
        prerequisites: ['Basic networking knowledge', 'Programming experience'],
        tags: ['cybersecurity', 'network security', 'ethical hacking', 'penetration testing'],
        lessons: [
          {
            title: 'Cybersecurity Overview',
            content: 'Introduction to cybersecurity concepts, threats, and defense strategies.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=inWWhr5tnEA',
            duration: 90,
            order: 1
          },
          {
            title: 'Network Security',
            content: 'Firewalls, intrusion detection, VPNs, and network monitoring.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=inWWhr5tnEA',
            duration: 120,
            order: 2
          },
          {
            title: 'Penetration Testing',
            content: 'Ethical hacking techniques, vulnerability assessment, and security testing.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=inWWhr5tnEA',
            duration: 150,
            order: 3
          },
          {
            title: 'Incident Response',
            content: 'Security incident handling, forensics, and recovery procedures.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=inWWhr5tnEA',
            duration: 100,
            order: 4
          }
        ],
        isPublished: true,
        estimatedDuration: 460
      }
    ]);

    console.log('✅ Courses created');

    // Create quizzes
    console.log('❓ Creating quizzes...');
    const quizzes = await Quiz.create([
      {
        title: 'JavaScript Basics Quiz',
        description: 'Test your knowledge of JavaScript fundamentals',
        course: courses[0]._id,
        duration: 15,
        passingScore: 70,
        difficulty: 'easy',
        questions: [
          {
            questionText: 'Which keyword is used to declare a variable in JavaScript?',
            questionType: 'multiple-choice',
            options: [
              { text: 'var', isCorrect: true },
              { text: 'variable', isCorrect: false },
              { text: 'v', isCorrect: false },
              { text: 'declare', isCorrect: false }
            ],
            explanation: 'In JavaScript, variables can be declared using var, let, or const keywords.',
            points: 1,
            order: 1
          },
          {
            questionText: 'JavaScript is a compiled language.',
            questionType: 'true-false',
            correctAnswer: 'false',
            explanation: 'JavaScript is an interpreted language, not compiled.',
            points: 1,
            order: 2
          },
          {
            questionText: 'What are the primitive data types in JavaScript?',
            questionType: 'multiple-answer',
            options: [
              { text: 'String', isCorrect: true },
              { text: 'Number', isCorrect: true },
              { text: 'Boolean', isCorrect: true },
              { text: 'Object', isCorrect: false }
            ],
            explanation: 'Primitive types include String, Number, Boolean, Null, Undefined, Symbol, and BigInt.',
            points: 2,
            order: 3
          },
          {
            questionText: 'Which function is used to parse a string to an integer?',
            questionType: 'multiple-choice',
            options: [
              { text: 'parseInt()', isCorrect: true },
              { text: 'parseInteger()', isCorrect: false },
              { text: 'toInt()', isCorrect: false },
              { text: 'convertInt()', isCorrect: false }
            ],
            explanation: 'parseInt() is the built-in function to convert strings to integers.',
            points: 1,
            order: 4
          },
          {
            questionText: 'Arrays in JavaScript can hold multiple data types.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'JavaScript arrays are flexible and can contain different data types.',
            points: 1,
            order: 5
          },
          {
            questionText: 'What is the output of: typeof null?',
            questionType: 'multiple-choice',
            options: [
              { text: 'object', isCorrect: true },
              { text: 'null', isCorrect: false },
              { text: 'undefined', isCorrect: false },
              { text: 'string', isCorrect: false }
            ],
            explanation: 'typeof null returns "object" due to a legacy bug in JavaScript.',
            points: 1,
            order: 6
          },
          {
            questionText: 'Which method adds an element to the end of an array?',
            questionType: 'multiple-choice',
            options: [
              { text: 'push()', isCorrect: true },
              { text: 'pop()', isCorrect: false },
              { text: 'shift()', isCorrect: false },
              { text: 'unshift()', isCorrect: false }
            ],
            explanation: 'push() adds elements to the end, while pop() removes from the end.',
            points: 1,
            order: 7
          },
          {
            questionText: 'The === operator checks for both value and type equality.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'The strict equality operator (===) checks both value and data type.',
            points: 1,
            order: 8
          },
          {
            questionText: 'What is a closure in JavaScript?',
            questionType: 'multiple-choice',
            options: [
              { text: 'A function with access to its own scope, outer function scope, and global scope', isCorrect: true },
              { text: 'A way to close browser windows', isCorrect: false },
              { text: 'An error handling mechanism', isCorrect: false },
              { text: 'A type of loop', isCorrect: false }
            ],
            explanation: 'Closures allow functions to access variables from outer scopes even after the outer function has returned.',
            points: 1,
            order: 9
          },
          {
            questionText: 'Which of these are looping structures in JavaScript?',
            questionType: 'multiple-answer',
            options: [
              { text: 'for', isCorrect: true },
              { text: 'while', isCorrect: true },
              { text: 'forEach', isCorrect: true },
              { text: 'if', isCorrect: false }
            ],
            explanation: 'for, while, do-while, and forEach are all looping structures in JavaScript.',
            points: 2,
            order: 10
          },
          {
            questionText: 'What does DOM stand for?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Document Object Model', isCorrect: true },
              { text: 'Data Object Model', isCorrect: false },
              { text: 'Digital Object Model', isCorrect: false },
              { text: 'Dynamic Object Model', isCorrect: false }
            ],
            explanation: 'DOM stands for Document Object Model, a programming interface for HTML documents.',
            points: 1,
            order: 11
          },
          {
            questionText: 'let and const are block-scoped.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'Unlike var, both let and const are block-scoped, meaning they exist only within the nearest enclosing block.',
            points: 1,
            order: 12
          },
          {
            questionText: 'Which method converts a JSON string to a JavaScript object?',
            questionType: 'multiple-choice',
            options: [
              { text: 'JSON.parse()', isCorrect: true },
              { text: 'JSON.stringify()', isCorrect: false },
              { text: 'JSON.convert()', isCorrect: false },
              { text: 'JSON.toObject()', isCorrect: false }
            ],
            explanation: 'JSON.parse() converts JSON strings to JavaScript objects, while JSON.stringify() does the opposite.',
            points: 1,
            order: 13
          },
          {
            questionText: 'What is the purpose of the this keyword?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Refers to the object that is executing the current function', isCorrect: true },
              { text: 'Creates a new variable', isCorrect: false },
              { text: 'Defines a constant', isCorrect: false },
              { text: 'Imports a module', isCorrect: false }
            ],
            explanation: 'The this keyword refers to the object that is currently executing the function.',
            points: 1,
            order: 14
          },
          {
            questionText: 'Arrow functions have their own this binding.',
            questionType: 'true-false',
            correctAnswer: 'false',
            explanation: 'Arrow functions do not have their own this binding; they inherit this from the parent scope.',
            points: 1,
            order: 15
          },
          {
            questionText: 'Which are valid ways to create an object in JavaScript?',
            questionType: 'multiple-answer',
            options: [
              { text: 'Object literal {}', isCorrect: true },
              { text: 'new Object()', isCorrect: true },
              { text: 'Object.create()', isCorrect: true },
              { text: 'createObject()', isCorrect: false }
            ],
            explanation: 'Objects can be created using literals, constructors, or Object.create().',
            points: 2,
            order: 16
          }
        ],
        isActive: true
      },
      {
        title: 'React Components Quiz',
        description: 'Test your understanding of React components and props',
        course: courses[1]._id,
        duration: 20,
        passingScore: 75,
        difficulty: 'medium',
        questions: [
          {
            questionText: 'What is JSX?',
            questionType: 'multiple-choice',
            options: [
              { text: 'JavaScript XML', isCorrect: true },
              { text: 'JavaScript Extension', isCorrect: false },
              { text: 'Java Syntax Extension', isCorrect: false },
              { text: 'JSON XML', isCorrect: false }
            ],
            explanation: 'JSX stands for JavaScript XML, allowing HTML-like syntax in JavaScript.',
            points: 1,
            order: 1
          },
          {
            questionText: 'React components must return a single root element.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'React components must return a single parent element or fragment.',
            points: 1,
            order: 2
          },
          {
            questionText: 'Which hooks are built into React?',
            questionType: 'multiple-answer',
            options: [
              { text: 'useState', isCorrect: true },
              { text: 'useEffect', isCorrect: true },
              { text: 'useData', isCorrect: false },
              { text: 'useComponent', isCorrect: false }
            ],
            explanation: 'React provides many built-in hooks including useState, useEffect, useContext, etc.',
            points: 2,
            order: 3
          },
          {
            questionText: 'What does useState return?',
            questionType: 'multiple-choice',
            options: [
              { text: 'An array with state value and setter function', isCorrect: true },
              { text: 'A single state value', isCorrect: false },
              { text: 'An object with state properties', isCorrect: false },
              { text: 'A function to update state', isCorrect: false }
            ],
            explanation: 'useState returns an array containing the current state value and a function to update it.',
            points: 1,
            order: 4
          },
          {
            questionText: 'Props are mutable in React.',
            questionType: 'true-false',
            correctAnswer: 'false',
            explanation: 'Props are read-only and cannot be modified by the component receiving them.',
            points: 1,
            order: 5
          },
          {
            questionText: 'What is the Virtual DOM?',
            questionType: 'multiple-choice',
            options: [
              { text: 'A lightweight copy of the actual DOM', isCorrect: true },
              { text: 'A database for React', isCorrect: false },
              { text: 'A testing framework', isCorrect: false },
              { text: 'A CSS framework', isCorrect: false }
            ],
            explanation: 'The Virtual DOM is a lightweight representation that React uses to optimize updates.',
            points: 1,
            order: 6
          },
          {
            questionText: 'useEffect runs after every render by default.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'Without a dependency array, useEffect runs after every render.',
            points: 1,
            order: 7
          },
          {
            questionText: 'Which are valid ways to handle events in React?',
            questionType: 'multiple-answer',
            options: [
              { text: 'onClick={handleClick}', isCorrect: true },
              { text: 'onClick={() => handleClick()}', isCorrect: true },
              { text: 'on-click="handleClick"', isCorrect: false },
              { text: 'onclick={handleClick}', isCorrect: false }
            ],
            explanation: 'React uses camelCase event handlers like onClick, onChange, etc.',
            points: 2,
            order: 8
          },
          {
            questionText: 'What is the purpose of keys in React lists?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Help React identify which items have changed', isCorrect: true },
              { text: 'Encrypt the data', isCorrect: false },
              { text: 'Style the elements', isCorrect: false },
              { text: 'Add security', isCorrect: false }
            ],
            explanation: 'Keys help React identify which items in a list have changed, been added, or removed.',
            points: 1,
            order: 9
          },
          {
            questionText: 'React is a JavaScript library, not a framework.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'React is officially a library for building UIs, not a complete framework.',
            points: 1,
            order: 10
          },
          {
            questionText: 'What does the useContext hook do?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Allows components to access context values', isCorrect: true },
              { text: 'Creates a new context', isCorrect: false },
              { text: 'Manages component state', isCorrect: false },
              { text: 'Handles side effects', isCorrect: false }
            ],
            explanation: 'useContext allows functional components to consume context values.',
            points: 1,
            order: 11
          },
          {
            questionText: 'Which lifecycle methods are replaced by useEffect?',
            questionType: 'multiple-answer',
            options: [
              { text: 'componentDidMount', isCorrect: true },
              { text: 'componentDidUpdate', isCorrect: true },
              { text: 'componentWillUnmount', isCorrect: true },
              { text: 'render', isCorrect: false }
            ],
            explanation: 'useEffect can replicate componentDidMount, componentDidUpdate, and componentWillUnmount.',
            points: 2,
            order: 12
          },
          {
            questionText: 'What is prop drilling?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Passing props through multiple component layers', isCorrect: true },
              { text: 'A React debugging tool', isCorrect: false },
              { text: 'A performance optimization', isCorrect: false },
              { text: 'A testing technique', isCorrect: false }
            ],
            explanation: 'Prop drilling is passing props through intermediate components that don\'t need them.',
            points: 1,
            order: 13
          },
          {
            questionText: 'React.Fragment can be written as <> </> shorthand.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'The shorthand syntax <> </> is equivalent to <React.Fragment></React.Fragment>.',
            points: 1,
            order: 14
          },
          {
            questionText: 'What is the purpose of React.memo?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Prevents unnecessary re-renders of components', isCorrect: true },
              { text: 'Stores data in memory', isCorrect: false },
              { text: 'Creates memoized values', isCorrect: false },
              { text: 'Manages application state', isCorrect: false }
            ],
            explanation: 'React.memo is a higher-order component that prevents re-renders when props haven\'t changed.',
            points: 1,
            order: 15
          }
        ],
        isActive: true
      },
      {
        title: 'Algorithms Quiz',
        description: 'Test your knowledge of algorithms and complexity',
        course: courses[2]._id,
        duration: 25,
        passingScore: 70,
        difficulty: 'hard',
        questions: [
          {
            questionText: 'What is the time complexity of binary search?',
            questionType: 'multiple-choice',
            options: [
              { text: 'O(log n)', isCorrect: true },
              { text: 'O(n)', isCorrect: false },
              { text: 'O(n log n)', isCorrect: false },
              { text: 'O(n²)', isCorrect: false }
            ],
            explanation: 'Binary search has O(log n) time complexity as it halves the search space each iteration.',
            points: 2,
            order: 1
          },
          {
            questionText: 'Quicksort has O(n log n) average time complexity.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'Quicksort averages O(n log n) but worst case is O(n²).',
            points: 1,
            order: 2
          },
          {
            questionText: 'What data structure uses LIFO (Last In First Out)?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Stack', isCorrect: true },
              { text: 'Queue', isCorrect: false },
              { text: 'Array', isCorrect: false },
              { text: 'Tree', isCorrect: false }
            ],
            explanation: 'A Stack follows the LIFO principle, while a Queue follows FIFO.',
            points: 1,
            order: 3
          },
          {
            questionText: 'Hash tables have O(1) average lookup time.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'Hash tables provide constant-time average-case lookup, insertion, and deletion.',
            points: 1,
            order: 4
          },
          {
            questionText: 'Which sorting algorithms are comparison-based?',
            questionType: 'multiple-answer',
            options: [
              { text: 'Quicksort', isCorrect: true },
              { text: 'Merge Sort', isCorrect: true },
              { text: 'Counting Sort', isCorrect: false },
              { text: 'Radix Sort', isCorrect: false }
            ],
            explanation: 'Comparison-based sorts compare elements, while counting and radix sort use other techniques.',
            points: 2,
            order: 5
          },
          {
            questionText: 'What is the worst-case time complexity of insertion sort?',
            questionType: 'multiple-choice',
            options: [
              { text: 'O(n²)', isCorrect: true },
              { text: 'O(n log n)', isCorrect: false },
              { text: 'O(n)', isCorrect: false },
              { text: 'O(log n)', isCorrect: false }
            ],
            explanation: 'Insertion sort has O(n²) worst-case complexity but O(n) best-case for nearly sorted arrays.',
            points: 2,
            order: 6
          },
          {
            questionText: 'A binary tree with n nodes has at most log(n) levels.',
            questionType: 'true-false',
            correctAnswer: 'false',
            explanation: 'A balanced binary tree has log(n) levels, but an unbalanced tree can have n levels.',
            points: 1,
            order: 7
          },
          {
            questionText: 'Which algorithm is best for finding shortest path in a weighted graph?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Dijkstra\'s algorithm', isCorrect: true },
              { text: 'Binary search', isCorrect: false },
              { text: 'Bubble sort', isCorrect: false },
              { text: 'Linear search', isCorrect: false }
            ],
            explanation: 'Dijkstra\'s algorithm finds shortest paths from a source to all vertices in weighted graphs.',
            points: 2,
            order: 8
          },
          {
            questionText: 'Which data structures can be used to implement a priority queue?',
            questionType: 'multiple-answer',
            options: [
              { text: 'Heap', isCorrect: true },
              { text: 'Binary Search Tree', isCorrect: true },
              { text: 'Array', isCorrect: true },
              { text: 'None', isCorrect: false }
            ],
            explanation: 'Priority queues can be implemented with heaps (most efficient), BSTs, or arrays.',
            points: 2,
            order: 9
          },
          {
            questionText: 'What is space complexity?',
            questionType: 'multiple-choice',
            options: [
              { text: 'The amount of memory an algorithm uses', isCorrect: true },
              { text: 'The time an algorithm takes', isCorrect: false },
              { text: 'The number of operations', isCorrect: false },
              { text: 'The input size', isCorrect: false }
            ],
            explanation: 'Space complexity measures the total memory space required by an algorithm.',
            points: 1,
            order: 10
          },
          {
            questionText: 'Breadth-First Search uses a queue.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'BFS uses a queue to explore nodes level by level, while DFS uses a stack.',
            points: 1,
            order: 11
          },
          {
            questionText: 'What is the best-case time complexity of quicksort?',
            questionType: 'multiple-choice',
            options: [
              { text: 'O(n log n)', isCorrect: true },
              { text: 'O(n²)', isCorrect: false },
              { text: 'O(n)', isCorrect: false },
              { text: 'O(log n)', isCorrect: false }
            ],
            explanation: 'Quicksort\'s best and average case is O(n log n), worst case is O(n²).',
            points: 2,
            order: 12
          },
          {
            questionText: 'Which algorithms use divide and conquer?',
            questionType: 'multiple-answer',
            options: [
              { text: 'Merge Sort', isCorrect: true },
              { text: 'Quicksort', isCorrect: true },
              { text: 'Binary Search', isCorrect: true },
              { text: 'Bubble Sort', isCorrect: false }
            ],
            explanation: 'Divide and conquer algorithms split problems into subproblems, solve them, and combine results.',
            points: 2,
            order: 13
          },
          {
            questionText: 'A linked list allows O(1) access to any element.',
            questionType: 'true-false',
            correctAnswer: 'false',
            explanation: 'Linked lists require O(n) time for random access, unlike arrays with O(1) access.',
            points: 1,
            order: 14
          },
          {
            questionText: 'What is the main advantage of merge sort over quicksort?',
            questionType: 'multiple-choice',
            options: [
              { text: 'Guaranteed O(n log n) time complexity', isCorrect: true },
              { text: 'Uses less memory', isCorrect: false },
              { text: 'Faster in practice', isCorrect: false },
              { text: 'Simpler to implement', isCorrect: false }
            ],
            explanation: 'Merge sort always runs in O(n log n) time, while quicksort can degrade to O(n²).',
            points: 2,
            order: 15
          },
          {
            questionText: 'Dynamic programming is used to solve problems with overlapping subproblems.',
            questionType: 'true-false',
            correctAnswer: 'true',
            explanation: 'Dynamic programming optimizes recursive solutions by caching results of overlapping subproblems.',
            points: 1,
            order: 16
          }
        ],
        isActive: true
      }
    ]);

    console.log('✅ Quizzes created');

    // Enroll students in courses
    console.log('📝 Enrolling students...');
    courses[0].enrolledStudents.push(students[0]._id, students[1]._id);
    courses[1].enrolledStudents.push(students[0]._id);
    courses[2].enrolledStudents.push(students[1]._id);
    
    await Promise.all(courses.map(c => c.save()));

    students[0].enrolledCourses.push(courses[0]._id, courses[1]._id);
    students[1].enrolledCourses.push(courses[0]._id, courses[2]._id);
    
    await Promise.all(students.map(s => s.save()));

    // Create progress entries
    console.log('📊 Creating progress entries...');
    await Progress.create([
      {
        user: students[0]._id,
        course: courses[0]._id,
        completionPercentage: 40,
        lessonsProgress: [
          { lessonId: courses[0].lessons[0]._id, completed: true, completedAt: new Date(), timeSpent: 15 },
          { lessonId: courses[0].lessons[1]._id, completed: true, completedAt: new Date(), timeSpent: 20 }
        ],
        quizAttempts: [
          {
            quiz: quizzes[0]._id,
            score: 5,
            totalPoints: 6,
            percentage: 83,
            passed: true,
            answers: [],
            attemptedAt: new Date()
          }
        ],
        totalTimeSpent: 35
      },
      {
        user: students[0]._id,
        course: courses[1]._id,
        completionPercentage: 25,
        lessonsProgress: [
          { lessonId: courses[1].lessons[0]._id, completed: true, completedAt: new Date(), timeSpent: 20 }
        ],
        totalTimeSpent: 20
      },
      {
        user: students[1]._id,
        course: courses[0]._id,
        completionPercentage: 60,
        lessonsProgress: [
          { lessonId: courses[0].lessons[0]._id, completed: true, completedAt: new Date(), timeSpent: 15 },
          { lessonId: courses[0].lessons[1]._id, completed: true, completedAt: new Date(), timeSpent: 20 },
          { lessonId: courses[0].lessons[2]._id, completed: true, completedAt: new Date(), timeSpent: 25 }
        ],
        totalTimeSpent: 60
      }
    ]);

    console.log('✅ Progress entries created');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📧 Demo Accounts:');
    console.log('   Student: student@example.com / password123');
    console.log('   Instructor: instructor@example.com / password123');
    console.log('   Admin: admin@example.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
const runSeeder = async () => {
  await connectDB();
  await seedDatabase();
};

runSeeder();
