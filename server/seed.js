/**
 * Study Buddy — Database Seed Script
 * Uses Supabase (PostgreSQL) — NOT mongoose.
 * Run: node server/seed.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const supabase = require('./config/supabase');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function probeColumns(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    console.warn(`  Could not probe ${table}:`, error.message);
    return [];
  }
  const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
  console.log(`  [${table}] columns:`, cols.join(', ') || '(empty table — unknown columns)');
  return cols;
}

async function clearTable(table) {
  // Delete all rows — Supabase requires a filter; use neq on id with a non-matching value won't work.
  // Use a raw delete with a truthy filter via gt on a common column or use .neq('id', '00000000-0000-0000-0000-000000000000').
  const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    console.warn(`  Warning clearing ${table}:`, error.message);
  } else {
    console.log(`  Cleared ${table}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main seed
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n=== Study Buddy Seed Script ===\n');

  // ── 1. Probe actual columns ────────────────────────────────────────────────
  console.log('Probing table schemas...');
  await probeColumns('users');
  await probeColumns('courses');
  await probeColumns('lessons');
  await probeColumns('quizzes');
  await probeColumns('questions');
  await probeColumns('enrollments');
  await probeColumns('quiz_attempts');

  // ── 2. Clear existing data (order matters for FK constraints) ─────────────
  console.log('\nClearing existing data...');
  await clearTable('quiz_attempts');
  await clearTable('questions');
  await clearTable('quizzes');
  await clearTable('enrollments');
  await clearTable('progress');
  await clearTable('lessons');
  await clearTable('courses');
  // Clear non-admin users only (keep any manually created admins)
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  Cleared users');

  // ── 3. Create users ────────────────────────────────────────────────────────
  console.log('\nCreating users...');
  const password = await bcrypt.hash('password123', 10);

  const { data: users, error: usersErr } = await supabase
    .from('users')
    .insert([
      {
        name: 'Dr. Sarah Williams',
        email: 'instructor@studybuddy.com',
        password_hash: password,
        role: 'instructor'
      },
      {
        name: 'Alice Johnson',
        email: 'student@studybuddy.com',
        password_hash: password,
        role: 'student'
      },
      {
        name: 'Bob Smith',
        email: 'bob@studybuddy.com',
        password_hash: password,
        role: 'student'
      }
    ])
    .select('id, name, email, role');

  if (usersErr) throw new Error('Users insert failed: ' + usersErr.message);
  console.log(`  Created ${users.length} users`);

  const instructor = users.find(u => u.role === 'instructor');
  const student1 = users.find(u => u.email === 'student@studybuddy.com');

  // ── 4. Course + lesson + quiz data ────────────────────────────────────────
  const coursesData = [
    {
      title: 'Python for Beginners',
      description: 'Learn Python from scratch with hands-on projects',
      category: 'programming',
      lessons: [
        { title: 'Introduction to Python',  video_url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8', order_num: 1, duration_minutes: 46, description: 'Get started with Python — installation, IDLE, and your first script.' },
        { title: 'Variables & Data Types',  video_url: 'https://www.youtube.com/watch?v=cQT33yu9pY8', order_num: 2, duration_minutes: 28, description: 'Understand integers, floats, strings, and booleans.' },
        { title: 'Control Flow',            video_url: 'https://www.youtube.com/watch?v=DZwmZ8Usvnk', order_num: 3, duration_minutes: 35, description: 'Master if/elif/else and loops.' },
        { title: 'Functions in Python',     video_url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I', order_num: 4, duration_minutes: 52, description: 'Define reusable functions with parameters and return values.' },
        { title: 'Lists, Dicts & Tuples',   video_url: 'https://www.youtube.com/watch?v=W8KRzm-HUcc', order_num: 5, duration_minutes: 44, description: 'Work with Python\'s core data structures.' }
      ],
      quiz: {
        title: 'Python Fundamentals Quiz',
        description: 'Test your knowledge of Python basics',
        time_limit_minutes: 15,
        passing_score: 70,
        questions: [
          {
            question_text: 'The keyword used to define a function in Python is ___',
            question_type: 'fill_blank',
            options: [],
            correct_answer: 'def',
            explanation: 'def keyword defines functions. Example: def my_function():',
            order_num: 1
          },
          {
            question_text: 'What does len([1,2,3]) return?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: '3', is_correct: true },
              { id: 'b', text: '2', is_correct: false },
              { id: 'c', text: '4', is_correct: false },
              { id: 'd', text: '1', is_correct: false }
            ],
            correct_answer: '3',
            explanation: 'len() returns the number of items in a list. [1,2,3] has 3 elements.',
            order_num: 2
          },
          {
            question_text: 'Python uses indentation to define code blocks',
            question_type: 'true_false',
            options: [],
            correct_answer: 'True',
            explanation: 'Unlike other languages that use braces {}, Python uses indentation (whitespace) to define code structure.',
            order_num: 3
          },
          {
            question_text: 'Which data type is immutable in Python?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: 'list',  is_correct: false },
              { id: 'b', text: 'dict',  is_correct: false },
              { id: 'c', text: 'tuple', is_correct: true },
              { id: 'd', text: 'set',   is_correct: false }
            ],
            correct_answer: 'tuple',
            explanation: 'Tuples are immutable — they cannot be changed after creation. Lists, dicts, and sets are mutable.',
            order_num: 4
          },
          {
            question_text: "To convert a string '42' to an integer, use ___('42')",
            question_type: 'fill_blank',
            options: [],
            correct_answer: 'int',
            explanation: 'int() converts strings and floats to integers. float() converts to decimal numbers.',
            order_num: 5
          }
        ]
      }
    },
    {
      title: 'Web Development Fundamentals',
      description: 'Build modern websites with HTML, CSS, and JavaScript',
      category: 'programming',
      lessons: [
        { title: 'HTML Crash Course',   video_url: 'https://www.youtube.com/watch?v=qz0aGYrrlhU', order_num: 1, duration_minutes: 60, description: 'Learn the building blocks of every webpage.' },
        { title: 'CSS Fundamentals',    video_url: 'https://www.youtube.com/watch?v=yfoY53QXEnI', order_num: 2, duration_minutes: 45, description: 'Style your pages with selectors, the box model, and Flexbox.' },
        { title: 'JavaScript Basics',   video_url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c', order_num: 3, duration_minutes: 55, description: 'Add interactivity with variables, functions, and DOM manipulation.' },
        { title: 'Responsive Design',   video_url: 'https://www.youtube.com/watch?v=srvUrASNj0s', order_num: 4, duration_minutes: 38, description: 'Use media queries and fluid layouts for any screen size.' },
        { title: 'Building a Website',  video_url: 'https://www.youtube.com/watch?v=pQN-pnXPaVg', order_num: 5, duration_minutes: 62, description: 'Put it all together and build a complete project.' }
      ],
      quiz: {
        title: 'Web Development Quiz',
        description: 'Test your HTML, CSS and JavaScript knowledge',
        time_limit_minutes: 15,
        passing_score: 70,
        questions: [
          {
            question_text: 'Which HTML tag creates a hyperlink?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: '<a>',    is_correct: true },
              { id: 'b', text: '<link>', is_correct: false },
              { id: 'c', text: '<href>', is_correct: false },
              { id: 'd', text: '<url>',  is_correct: false }
            ],
            correct_answer: '<a>',
            explanation: 'The <a> (anchor) tag creates hyperlinks. The href attribute specifies the destination.',
            order_num: 1
          },
          {
            question_text: 'CSS stands for Cascading Style Sheets',
            question_type: 'true_false',
            options: [],
            correct_answer: 'True',
            explanation: 'CSS (Cascading Style Sheets) describes how HTML elements are displayed on screen.',
            order_num: 2
          },
          {
            question_text: 'In CSS, to make text bold you use font-weight: ___',
            question_type: 'fill_blank',
            options: [],
            correct_answer: 'bold',
            explanation: 'font-weight: bold makes text bold. You can also use numeric values like 700.',
            order_num: 3
          },
          {
            question_text: 'Which JavaScript method adds an element to the end of an array?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: 'push()',   is_correct: true },
              { id: 'b', text: 'pop()',    is_correct: false },
              { id: 'c', text: 'shift()',  is_correct: false },
              { id: 'd', text: 'splice()', is_correct: false }
            ],
            correct_answer: 'push()',
            explanation: 'push() adds one or more elements to the end of an array and returns the new length.',
            order_num: 4
          },
          {
            question_text: 'HTML is a programming language',
            question_type: 'true_false',
            options: [],
            correct_answer: 'False',
            explanation: 'HTML is a markup language, not a programming language. It structures content but cannot perform logic or calculations.',
            order_num: 5
          }
        ]
      }
    },
    {
      title: 'Data Structures & Algorithms',
      description: 'Master fundamental computer science concepts for technical interviews',
      category: 'programming',
      lessons: [
        { title: 'Big O Notation',       video_url: 'https://www.youtube.com/watch?v=Mo4vesaut8g', order_num: 1, duration_minutes: 20, description: 'Analyse algorithm efficiency with Big O.' },
        { title: 'Arrays & Linked Lists',video_url: 'https://www.youtube.com/watch?v=RBSGKlAvoiM', order_num: 2, duration_minutes: 40, description: 'Understand the two most fundamental data structures.' },
        { title: 'Stacks & Queues',      video_url: 'https://www.youtube.com/watch?v=wjI1WNcIntg', order_num: 3, duration_minutes: 35, description: 'LIFO and FIFO structures and their real-world uses.' },
        { title: 'Binary Search',        video_url: 'https://www.youtube.com/watch?v=P3YID7liBug', order_num: 4, duration_minutes: 22, description: 'Efficiently search sorted collections in O(log n).' },
        { title: 'Sorting Algorithms',   video_url: 'https://www.youtube.com/watch?v=kgBjXUE_Nwc', order_num: 5, duration_minutes: 55, description: 'Compare bubble sort, merge sort, quick sort and more.' }
      ],
      quiz: {
        title: 'DSA Quiz',
        description: 'Test your knowledge of data structures and algorithms',
        time_limit_minutes: 15,
        passing_score: 70,
        questions: [
          {
            question_text: 'What is the time complexity of binary search?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: 'O(n)',      is_correct: false },
              { id: 'b', text: 'O(log n)',  is_correct: true },
              { id: 'c', text: 'O(n²)',     is_correct: false },
              { id: 'd', text: 'O(1)',      is_correct: false }
            ],
            correct_answer: 'O(log n)',
            explanation: 'Binary search halves the search space each step, giving O(log n) — far more efficient than linear O(n) for sorted arrays.',
            order_num: 1
          },
          {
            question_text: 'A stack follows FIFO order',
            question_type: 'true_false',
            options: [],
            correct_answer: 'False',
            explanation: 'A stack follows LIFO (Last In, First Out) — like a stack of plates. FIFO is used by queues.',
            order_num: 2
          },
          {
            question_text: 'The sorting algorithm with average time complexity O(n log n) that uses divide-and-conquer is ___',
            question_type: 'fill_blank',
            options: [],
            correct_answer: 'merge sort',
            explanation: 'Merge sort divides the array in half recursively then merges sorted halves. Time: O(n log n).',
            order_num: 3
          },
          {
            question_text: 'Which data structure uses nodes with pointers to next elements?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: 'Array',       is_correct: false },
              { id: 'b', text: 'Linked List', is_correct: true },
              { id: 'c', text: 'Stack',       is_correct: false },
              { id: 'd', text: 'Hash Table',  is_correct: false }
            ],
            correct_answer: 'Linked List',
            explanation: 'Linked lists store elements as nodes where each node holds data and a pointer to the next node.',
            order_num: 4
          },
          {
            question_text: 'A graph with no cycles is called a ___',
            question_type: 'fill_blank',
            options: [],
            correct_answer: 'tree',
            explanation: 'A tree is an acyclic connected graph. It has n nodes and exactly n-1 edges.',
            order_num: 5
          }
        ]
      }
    },
    {
      title: 'Mathematics for Computing',
      description: 'Essential maths behind computer science: logic, graphs, sets, and probability',
      category: 'mathematics',
      lessons: [
        { title: 'Number Systems',  video_url: 'https://www.youtube.com/watch?v=aHs3GBqvEqs', order_num: 1, duration_minutes: 30, description: 'Binary, octal, decimal, and hexadecimal systems.' },
        { title: 'Boolean Algebra', video_url: 'https://www.youtube.com/watch?v=RYDiDpW2VkM', order_num: 2, duration_minutes: 25, description: 'Logic gates, truth tables, and simplification.' },
        { title: 'Set Theory',      video_url: 'https://www.youtube.com/watch?v=tyDKR4FG3Yw', order_num: 3, duration_minutes: 28, description: 'Union, intersection, complements and Venn diagrams.' },
        { title: 'Graph Theory',    video_url: 'https://www.youtube.com/watch?v=LFKZLXVO-Dg', order_num: 4, duration_minutes: 45, description: 'Vertices, edges, paths, and trees.' },
        { title: 'Probability Basics', video_url: 'https://www.youtube.com/watch?v=uzkc-qNVoOk', order_num: 5, duration_minutes: 35, description: 'Events, sample spaces, and the addition rule.' }
      ],
      quiz: {
        title: 'Maths for Computing Quiz',
        description: 'Test your discrete maths knowledge',
        time_limit_minutes: 15,
        passing_score: 70,
        questions: [
          {
            question_text: 'In binary, what is 1010 in decimal?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: '8',  is_correct: false },
              { id: 'b', text: '10', is_correct: true },
              { id: 'c', text: '12', is_correct: false },
              { id: 'd', text: '14', is_correct: false }
            ],
            correct_answer: '10',
            explanation: '1010 in binary = 1×8 + 0×4 + 1×2 + 0×1 = 8+2 = 10.',
            order_num: 1
          },
          {
            question_text: 'In Boolean algebra, A AND NOT(A) always equals 1',
            question_type: 'true_false',
            options: [],
            correct_answer: 'False',
            explanation: 'A AND NOT(A) = 0 always (a contradiction). A OR NOT(A) = 1 always (a tautology).',
            order_num: 2
          },
          {
            question_text: 'The number of edges in a complete graph with 4 vertices is ___',
            question_type: 'fill_blank',
            options: [],
            correct_answer: '6',
            explanation: 'A complete graph Kn has n(n-1)/2 edges. K4 = 4×3/2 = 6 edges.',
            order_num: 3
          },
          {
            question_text: 'What is the union of sets A={1,2,3} and B={3,4,5}?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: '{1,2,3,4,5}',     is_correct: true },
              { id: 'b', text: '{3}',              is_correct: false },
              { id: 'c', text: '{1,2,4,5}',        is_correct: false },
              { id: 'd', text: '{1,2,3,3,4,5}',    is_correct: false }
            ],
            correct_answer: '{1,2,3,4,5}',
            explanation: 'Union A∪B contains all elements from both sets (no duplicates).',
            order_num: 4
          },
          {
            question_text: 'P(A) + P(not A) = 1 for any event A',
            question_type: 'true_false',
            options: [],
            correct_answer: 'True',
            explanation: 'The complement rule: an event either happens or it does not, so probabilities sum to 1.',
            order_num: 5
          }
        ]
      }
    },
    {
      title: 'Introduction to Machine Learning',
      description: 'Understand AI fundamentals, supervised learning, neural networks, and model evaluation',
      category: 'science',
      lessons: [
        { title: 'What is ML?',        video_url: 'https://www.youtube.com/watch?v=ukzFI9rgwfU', order_num: 1, duration_minutes: 15, description: 'A plain-English introduction to machine learning concepts.' },
        { title: 'Linear Regression',  video_url: 'https://www.youtube.com/watch?v=nk2CQITm_eo', order_num: 2, duration_minutes: 40, description: 'Predict continuous values with the simplest ML model.' },
        { title: 'Classification',     video_url: 'https://www.youtube.com/watch?v=0B5eIE_1vpU', order_num: 3, duration_minutes: 35, description: 'Assign categories using logistic regression and decision trees.' },
        { title: 'Neural Networks',    video_url: 'https://www.youtube.com/watch?v=aircAruvnKk', order_num: 4, duration_minutes: 20, description: 'How layers of neurons learn from data.' },
        { title: 'Model Evaluation',   video_url: 'https://www.youtube.com/watch?v=85dtiMz9tSo', order_num: 5, duration_minutes: 30, description: 'Accuracy, precision, recall, and avoiding overfitting.' }
      ],
      quiz: {
        title: 'Machine Learning Quiz',
        description: 'Test your ML fundamentals',
        time_limit_minutes: 15,
        passing_score: 70,
        questions: [
          {
            question_text: 'What type of learning uses labelled training data?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: 'Supervised',     is_correct: true },
              { id: 'b', text: 'Unsupervised',   is_correct: false },
              { id: 'c', text: 'Reinforcement',  is_correct: false },
              { id: 'd', text: 'Semi-supervised',is_correct: false }
            ],
            correct_answer: 'Supervised',
            explanation: 'Supervised learning trains on labelled data (input→output pairs). The model learns to predict outputs for new inputs.',
            order_num: 1
          },
          {
            question_text: 'A neural network with zero hidden layers is called a perceptron',
            question_type: 'true_false',
            options: [],
            correct_answer: 'True',
            explanation: 'A perceptron is a single-layer neural network — it maps inputs directly to an output with no hidden layers.',
            order_num: 2
          },
          {
            question_text: 'The evaluation metric that measures the proportion of correct predictions is called ___',
            question_type: 'fill_blank',
            options: [],
            correct_answer: 'accuracy',
            explanation: 'Accuracy = correct predictions / total predictions. Useful for balanced datasets.',
            order_num: 3
          },
          {
            question_text: 'Which algorithm draws a boundary to separate classes with maximum margin?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: 'SVM',           is_correct: true },
              { id: 'b', text: 'KNN',           is_correct: false },
              { id: 'c', text: 'Decision Tree', is_correct: false },
              { id: 'd', text: 'Naive Bayes',   is_correct: false }
            ],
            correct_answer: 'SVM',
            explanation: 'Support Vector Machines find the hyperplane that maximises the margin between classes.',
            order_num: 4
          },
          {
            question_text: 'Overfitting occurs when a model performs well on ___ data but poorly on new data',
            question_type: 'fill_blank',
            options: [],
            correct_answer: 'training',
            explanation: 'Overfitting means the model memorises training data including noise, but fails to generalise.',
            order_num: 5
          }
        ]
      }
    },
    {
      title: 'Business & Entrepreneurship',
      description: 'Launch and grow a business — from market research to scaling up',
      category: 'business',
      lessons: [
        { title: 'Starting a Business', video_url: 'https://www.youtube.com/watch?v=g6GJpvj-Lp4', order_num: 1, duration_minutes: 25, description: 'Legal structures, business plans, and the entrepreneurial mindset.' },
        { title: 'Market Research',     video_url: 'https://www.youtube.com/watch?v=K7MxcOXZvAE', order_num: 2, duration_minutes: 30, description: 'Understand your customers and validate demand before building.' },
        { title: 'Financial Basics',    video_url: 'https://www.youtube.com/watch?v=WEDIj9JBTC8', order_num: 3, duration_minutes: 35, description: 'Revenue, costs, margins, cash flow and break-even analysis.' },
        { title: 'Marketing Strategy',  video_url: 'https://www.youtube.com/watch?v=vGraOlZNyzU', order_num: 4, duration_minutes: 28, description: 'Reach customers with the 4 Ps and digital channels.' },
        { title: 'Scaling Up',          video_url: 'https://www.youtube.com/watch?v=Fdi1-_NZHDE', order_num: 5, duration_minutes: 22, description: 'Systems, hiring, and growth strategies for expanding your business.' }
      ],
      quiz: {
        title: 'Business & Entrepreneurship Quiz',
        description: 'Test your business knowledge',
        time_limit_minutes: 15,
        passing_score: 70,
        questions: [
          {
            question_text: 'What does USP stand for in business?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: 'Unique Selling Proposition', is_correct: true },
              { id: 'b', text: 'Universal Sales Plan',       is_correct: false },
              { id: 'c', text: 'Unified Service Protocol',   is_correct: false },
              { id: 'd', text: 'User Satisfaction Point',    is_correct: false }
            ],
            correct_answer: 'Unique Selling Proposition',
            explanation: 'USP is what differentiates your product from competitors — the unique value you offer customers.',
            order_num: 1
          },
          {
            question_text: 'Cash flow and profit mean the same thing',
            question_type: 'true_false',
            options: [],
            correct_answer: 'False',
            explanation: 'Profit is revenue minus costs. Cash flow is actual money moving in/out. A profitable business can still fail from poor cash flow.',
            order_num: 2
          },
          {
            question_text: 'The 4 Ps of marketing are Product, Price, Place, and ___',
            question_type: 'fill_blank',
            options: [],
            correct_answer: 'Promotion',
            explanation: 'The Marketing Mix: Product (what you sell), Price (cost), Place (distribution), Promotion (how you reach customers).',
            order_num: 3
          },
          {
            question_text: 'What is the term for researching customers\' needs before launching a product?',
            question_type: 'mcq',
            options: [
              { id: 'a', text: 'Market Research', is_correct: true },
              { id: 'b', text: 'Branding',        is_correct: false },
              { id: 'c', text: 'Monetisation',    is_correct: false },
              { id: 'd', text: 'Pivoting',        is_correct: false }
            ],
            correct_answer: 'Market Research',
            explanation: 'Market research involves gathering data about target customers, competitors, and demand before product launch.',
            order_num: 4
          },
          {
            question_text: 'A startup and a small business are always the same thing',
            question_type: 'true_false',
            options: [],
            correct_answer: 'False',
            explanation: 'Startups aim for rapid growth and scalability (often tech-based). Small businesses typically aim for stable, local operations.',
            order_num: 5
          }
        ]
      }
    }
  ];

  // ── 5. Insert courses, lessons, quizzes, questions ─────────────────────────
  console.log('\nInserting courses, lessons, quizzes, and questions...');

  for (const courseData of coursesData) {
    // Insert course
    const { data: course, error: cErr } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        instructor_id: instructor.id,
        is_published: true,
        thumbnail_url: ''
      })
      .select('id, title')
      .single();

    if (cErr) throw new Error(`Course insert failed (${courseData.title}): ${cErr.message}`);
    console.log(`  Course: "${course.title}" (${course.id})`);

    // Insert lessons
    const lessonRows = courseData.lessons.map(l => ({
      course_id: course.id,
      title: l.title,
      description: l.description,
      video_url: l.video_url,
      order_num: l.order_num,
      duration_minutes: l.duration_minutes
    }));

    const { error: lErr } = await supabase.from('lessons').insert(lessonRows);
    if (lErr) throw new Error(`Lessons insert failed (${course.title}): ${lErr.message}`);
    console.log(`    + ${lessonRows.length} lessons`);

    // Insert quiz
    const { data: quiz, error: qErr } = await supabase
      .from('quizzes')
      .insert({
        course_id: course.id,
        title: courseData.quiz.title,
        description: courseData.quiz.description,
        time_limit_minutes: courseData.quiz.time_limit_minutes,
        passing_score: courseData.quiz.passing_score
      })
      .select('id')
      .single();

    if (qErr) throw new Error(`Quiz insert failed (${course.title}): ${qErr.message}`);

    // Insert questions
    const questionRows = courseData.quiz.questions.map(q => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      order_num: q.order_num
    }));

    const { error: qqErr } = await supabase.from('questions').insert(questionRows);
    if (qqErr) throw new Error(`Questions insert failed (${course.title}): ${qqErr.message}`);
    console.log(`    + 1 quiz with ${questionRows.length} questions`);
  }

  // ── 6. Enroll student1 in first 3 courses ─────────────────────────────────
  console.log('\nEnrolling demo student in first 3 courses...');

  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('instructor_id', instructor.id)
    .order('created_at', { ascending: true })
    .limit(3);

  for (const c of (allCourses || [])) {
    await supabase.from('enrollments').insert({ student_id: student1.id, course_id: c.id });
    await supabase.from('progress').insert({
      student_id: student1.id,
      course_id: c.id,
      completed_lessons: [],
      completion_percentage: 0,
      total_time_spent_minutes: 0
    });
    console.log(`  Enrolled in "${c.title}"`);
  }

  // ── 7. Summary ─────────────────────────────────────────────────────────────
  const { count: courseCount } = await supabase.from('courses').select('id', { count: 'exact', head: true });
  const { count: lessonCount } = await supabase.from('lessons').select('id', { count: 'exact', head: true });
  const { count: quizCount }   = await supabase.from('quizzes').select('id', { count: 'exact', head: true });
  const { count: qCount }      = await supabase.from('questions').select('id', { count: 'exact', head: true });
  const { count: userCount }   = await supabase.from('users').select('id', { count: 'exact', head: true });

  console.log('\n=== Seed Complete ===');
  console.log(`  Users:     ${userCount}`);
  console.log(`  Courses:   ${courseCount}`);
  console.log(`  Lessons:   ${lessonCount}`);
  console.log(`  Quizzes:   ${quizCount}`);
  console.log(`  Questions: ${qCount}`);
  console.log('\nDemo login credentials:');
  console.log('  Instructor: instructor@studybuddy.com / password123');
  console.log('  Student:    student@studybuddy.com    / password123');
}

seed().catch(err => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
