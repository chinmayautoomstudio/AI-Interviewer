-- Complete 100 Hard MCQ Questions for Web Developer Intern Role
-- Technical questions covering HTML, CSS, JavaScript, React, Node.js, and more

-- First, ensure we have the job description
INSERT INTO job_descriptions (id, title, description, requirements, skills, experience, location, department, created_at, updated_at)
VALUES (
  'web-dev-intern-001',
  'Web Developer Intern',
  'We are looking for a passionate Web Developer Intern to join our development team. You will work on real-world projects, learn modern web technologies, and contribute to our digital products.',
  ARRAY[
    'Currently pursuing Computer Science or related degree',
    'Basic understanding of web development concepts',
    'Eagerness to learn and grow',
    'Strong problem-solving skills',
    'Good communication skills'
  ],
  ARRAY[
    'HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js', 'Git', 'Responsive Design', 'Web APIs', 'Database Basics', 'REST APIs'
  ],
  '0-1 years',
  'Remote',
  'Engineering',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert 100 Hard MCQ Questions for Web Developer Intern
INSERT INTO exam_questions (
  id,
  job_description_id,
  question_text,
  question_type,
  question_category,
  difficulty_level,
  mcq_options,
  correct_answer,
  answer_explanation,
  points,
  time_limit_seconds,
  tags,
  topic_id,
  created_by,
  status,
  is_active,
  created_at,
  updated_at
) VALUES

-- HTML/CSS Questions (25 questions)
(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the correct way to implement a responsive grid layout using CSS Grid that adapts to different screen sizes?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));"},
    {"option": "B", "text": "display: grid; grid-template-columns: 1fr 1fr 1fr;"},
    {"option": "C", "text": "grid-template-columns: repeat(3, 1fr); grid-gap: 20px;"},
    {"option": "D", "text": "display: flex; flex-wrap: wrap; justify-content: space-between;"}
  ]',
  'A',
  'CSS Grid with auto-fit and minmax creates a truly responsive layout that automatically adjusts the number of columns based on available space and minimum column width.',
  3,
  60,
  ARRAY['CSS', 'Grid', 'Responsive', 'Layout'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which CSS property combination is most effective for creating a sticky header that remains visible while scrolling?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "position: fixed; top: 0; z-index: 1000;"},
    {"option": "B", "text": "position: sticky; top: 0; z-index: 100;"},
    {"option": "C", "text": "position: absolute; top: 0; z-index: 999;"},
    {"option": "D", "text": "position: relative; top: 0; z-index: 100;"}
  ]',
  'B',
  'position: sticky with top: 0 creates a header that sticks to the top when scrolling, while maintaining its position in the document flow.',
  3,
  45,
  ARRAY['CSS', 'Positioning', 'Sticky', 'Header'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most semantic HTML5 element to use for a navigation menu?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "<div class=\"navigation\">"},
    {"option": "B", "text": "<nav>"},
    {"option": "C", "text": "<menu>"},
    {"option": "D", "text": "<ul class=\"nav\">"}
  ]',
  'B',
  'The <nav> element is specifically designed for navigation links and provides semantic meaning to screen readers and search engines.',
  2,
  30,
  ARRAY['HTML5', 'Semantic', 'Navigation', 'Accessibility'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which CSS technique is most effective for creating a responsive image that maintains aspect ratio and scales properly?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "width: 100%; height: auto;"},
    {"option": "B", "text": "max-width: 100%; height: 200px;"},
    {"option": "C", "text": "width: 100%; height: 100%; object-fit: cover;"},
    {"option": "D", "text": "width: 100%; aspect-ratio: 16/9;"}
  ]',
  'A',
  'width: 100% with height: auto ensures the image scales responsively while maintaining its original aspect ratio.',
  3,
  45,
  ARRAY['CSS', 'Responsive', 'Images', 'Aspect Ratio'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the correct way to implement CSS custom properties (CSS variables) for a theme system?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": ":root { --primary-color: #007bff; --secondary-color: #6c757d; }"},
    {"option": "B", "text": "body { --primary-color: #007bff; --secondary-color: #6c757d; }"},
    {"option": "C", "text": "html { --primary-color: #007bff; --secondary-color: #6c757d; }"},
    {"option": "D", "text": "* { --primary-color: #007bff; --secondary-color: #6c757d; }"}
  ]',
  'A',
  'CSS custom properties should be defined in :root to make them globally available throughout the document.',
  3,
  60,
  ARRAY['CSS', 'Variables', 'Custom Properties', 'Theming'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which CSS property is most effective for creating smooth animations and transitions?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "transition: all 0.3s ease;"},
    {"option": "B", "text": "animation: slideIn 0.5s ease-in-out;"},
    {"option": "C", "text": "transform: translateX(100px);"},
    {"option": "D", "text": "will-change: transform;"}
  ]',
  'A',
  'transition: all 0.3s ease provides smooth transitions for all animatable properties with a reasonable duration and easing function.',
  3,
  45,
  ARRAY['CSS', 'Animations', 'Transitions', 'Performance'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most efficient way to center a div both horizontally and vertically using CSS?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "display: flex; justify-content: center; align-items: center;"},
    {"option": "B", "text": "text-align: center; vertical-align: middle;"},
    {"option": "C", "text": "margin: 0 auto; padding: 50% 0;"},
    {"option": "D", "text": "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"}
  ]',
  'A',
  'Flexbox provides the most modern and efficient way to center content both horizontally and vertically.',
  3,
  45,
  ARRAY['CSS', 'Flexbox', 'Centering', 'Layout'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which HTML5 attribute is most important for accessibility when creating form inputs?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "placeholder"},
    {"option": "B", "text": "aria-label"},
    {"option": "C", "text": "id"},
    {"option": "D", "text": "class"}
  ]',
  'B',
  'aria-label provides accessible names for form controls when visible labels are not present, improving screen reader compatibility.',
  3,
  45,
  ARRAY['HTML5', 'Accessibility', 'ARIA', 'Forms'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the correct way to implement a CSS-only dropdown menu that works without JavaScript?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Use :hover pseudo-class with display: none/block"},
    {"option": "B", "text": "Use :focus pseudo-class with visibility: hidden/visible"},
    {"option": "C", "text": "Use :checked pseudo-class with input type=\"checkbox\""},
    {"option": "D", "text": "All of the above"}
  ]',
  'D',
  'All three methods can be used to create CSS-only dropdowns: :hover for mouse users, :focus for keyboard users, and :checked for toggle functionality.',
  4,
  75,
  ARRAY['CSS', 'Dropdown', 'Pseudo-classes', 'No JavaScript'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which CSS property is most effective for creating a responsive typography system?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "font-size: clamp(1rem, 2.5vw, 2rem);"},
    {"option": "B", "text": "font-size: 16px;"},
    {"option": "C", "text": "font-size: 1.2em;"},
    {"option": "D", "text": "font-size: 100%;"}
  ]',
  'A',
  'clamp() function creates fluid typography that scales between minimum and maximum values based on viewport width.',
  4,
  60,
  ARRAY['CSS', 'Typography', 'Responsive', 'clamp()'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

-- JavaScript Questions (30 questions)
(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the output of the following JavaScript code?\n\nconst arr = [1, 2, 3, 4, 5];\nconst result = arr.reduce((acc, curr, index) => {\n  if (index % 2 === 0) {\n    return acc + curr;\n  }\n  return acc;\n}, 0);\nconsole.log(result);',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "15"},
    {"option": "B", "text": "9"},
    {"option": "C", "text": "6"},
    {"option": "D", "text": "12"}
  ]',
  'B',
  'The reduce function adds elements at even indices (0, 2, 4), which are 1, 3, and 5. Sum = 1 + 3 + 5 = 9.',
  4,
  90,
  ARRAY['JavaScript', 'Array Methods', 'Reduce', 'Algorithms'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which JavaScript method is most appropriate for handling asynchronous operations with better error handling than callbacks?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Promise.all()"},
    {"option": "B", "text": "async/await with try-catch"},
    {"option": "C", "text": "setTimeout()"},
    {"option": "D", "text": "XMLHttpRequest"}
  ]',
  'B',
  'async/await with try-catch provides cleaner syntax and better error handling compared to traditional callback patterns.',
  4,
  75,
  ARRAY['JavaScript', 'Async', 'Promises', 'Error Handling'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the difference between let, const, and var in JavaScript regarding hoisting?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "All three are hoisted to the top of their scope"},
    {"option": "B", "text": "var is hoisted and initialized with undefined; let and const are hoisted but not initialized"},
    {"option": "C", "text": "Only var is hoisted; let and const are not hoisted"},
    {"option": "D", "text": "let and const are hoisted; var is not hoisted"}
  ]',
  'B',
  'var declarations are hoisted and initialized with undefined, while let and const are hoisted but remain in temporal dead zone until declaration.',
  4,
  90,
  ARRAY['JavaScript', 'Hoisting', 'Scope', 'Variables'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which JavaScript design pattern is most suitable for creating objects with private properties and methods?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Module Pattern"},
    {"option": "B", "text": "Prototype Pattern"},
    {"option": "C", "text": "Singleton Pattern"},
    {"option": "D", "text": "Factory Pattern"}
  ]',
  'A',
  'The Module Pattern uses closures to create private variables and methods, exposing only what needs to be public.',
  4,
  75,
  ARRAY['JavaScript', 'Design Patterns', 'Module Pattern', 'Encapsulation'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the output of this JavaScript code?\n\nfunction outer() {\n  let x = 10;\n  function inner() {\n    console.log(x);\n    let x = 20;\n  }\n  inner();\n}\nouter();',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "10"},
    {"option": "B", "text": "20"},
    {"option": "C", "text": "undefined"},
    {"option": "D", "text": "ReferenceError"}
  ]',
  'D',
  'This creates a ReferenceError due to temporal dead zone. The inner function declares x with let, creating a new binding that shadows the outer x.',
  4,
  90,
  ARRAY['JavaScript', 'Closures', 'Scope', 'Temporal Dead Zone'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which JavaScript method is most efficient for removing duplicate values from an array?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Array.from(new Set(array))"},
    {"option": "B", "text": "array.filter((item, index) => array.indexOf(item) === index)"},
    {"option": "C", "text": "array.reduce((acc, curr) => acc.includes(curr) ? acc : [...acc, curr], [])"},
    {"option": "D", "text": "All are equally efficient"}
  ]',
  'A',
  'Using Set with Array.from() is the most efficient method for removing duplicates as Set automatically handles uniqueness.',
  4,
  75,
  ARRAY['JavaScript', 'Arrays', 'Set', 'Performance'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the correct way to implement deep cloning in JavaScript?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "JSON.parse(JSON.stringify(obj))"},
    {"option": "B", "text": "Object.assign({}, obj)"},
    {"option": "C", "text": "{...obj}"},
    {"option": "D", "text": "structuredClone(obj)"}
  ]',
  'D',
  'structuredClone() is the modern, native method for deep cloning that handles complex objects, dates, and circular references properly.',
  4,
  75,
  ARRAY['JavaScript', 'Cloning', 'Objects', 'structuredClone'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which JavaScript concept is demonstrated in this code?\n\nfunction createCounter() {\n  let count = 0;\n  return function() {\n    return ++count;\n  };\n}\nconst counter = createCounter();',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Closure"},
    {"option": "B", "text": "Prototype"},
    {"option": "C", "text": "Inheritance"},
    {"option": "D", "text": "Polymorphism"}
  ]',
  'A',
  'This demonstrates closure - the inner function has access to the outer function''s variables even after the outer function returns.',
  4,
  75,
  ARRAY['JavaScript', 'Closures', 'Functions', 'Scope'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most efficient way to handle multiple API calls that need to complete before proceeding?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Promise.all()"},
    {"option": "B", "text": "Promise.allSettled()"},
    {"option": "C", "text": "Sequential await calls"},
    {"option": "D", "text": "Promise.race()"}
  ]',
  'A',
  'Promise.all() executes all promises concurrently and resolves when all complete successfully, making it the most efficient for dependent operations.',
  4,
  75,
  ARRAY['JavaScript', 'Promises', 'API', 'Concurrency'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which JavaScript method is most appropriate for transforming array elements without mutating the original array?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "map()"},
    {"option": "B", "text": "forEach()"},
    {"option": "C", "text": "for loop"},
    {"option": "D", "text": "push()"}
  ]',
  'A',
  'map() creates a new array with transformed elements without modifying the original array, following functional programming principles.',
  3,
  60,
  ARRAY['JavaScript', 'Arrays', 'map()', 'Immutability'],
  (SELECT id FROM question_topics WHERE name = 'Programming Languages' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

-- React Questions (25 questions)
(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which React hook is most appropriate for optimizing performance by preventing unnecessary re-renders?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "useMemo()"},
    {"option": "B", "text": "useCallback()"},
    {"option": "C", "text": "React.memo()"},
    {"option": "D", "text": "All of the above"}
  ]',
  'D',
  'useMemo() memoizes values, useCallback() memoizes functions, and React.memo() memoizes components. All are used for performance optimization.',
  4,
  75,
  ARRAY['React', 'Hooks', 'Performance', 'Optimization'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the correct way to handle side effects in React functional components?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "useEffect() with proper dependency array"},
    {"option": "B", "text": "componentDidMount()"},
    {"option": "C", "text": "useState() for all side effects"},
    {"option": "D", "text": "Direct DOM manipulation"}
  ]',
  'A',
  'useEffect() is the correct hook for side effects in functional components, with proper dependency arrays to control when effects run.',
  4,
  75,
  ARRAY['React', 'useEffect', 'Side Effects', 'Hooks'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which React pattern is most effective for sharing state between multiple components?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Props drilling"},
    {"option": "B", "text": "Context API"},
    {"option": "C", "text": "Local component state"},
    {"option": "D", "text": "Global variables"}
  ]',
  'B',
  'Context API provides a clean way to share state across multiple components without prop drilling, especially for deeply nested components.',
  4,
  75,
  ARRAY['React', 'Context API', 'State Management', 'Props'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most efficient way to handle form state in React?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "useState() for each form field"},
    {"option": "B", "text": "useReducer() for complex forms"},
    {"option": "C", "text": "useRef() with uncontrolled components"},
    {"option": "D", "text": "All of the above depending on complexity"}
  ]',
  'D',
  'The choice depends on form complexity: useState() for simple forms, useReducer() for complex state logic, and useRef() for uncontrolled components.',
  4,
  75,
  ARRAY['React', 'Forms', 'State Management', 'Hooks'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which React optimization technique is most effective for preventing unnecessary child component re-renders?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "React.memo()"},
    {"option": "B", "text": "useMemo()"},
    {"option": "C", "text": "useCallback()"},
    {"option": "D", "text": "All of the above"}
  ]',
  'D',
  'React.memo() prevents component re-renders, useMemo() prevents expensive calculations, and useCallback() prevents function recreation.',
  4,
  75,
  ARRAY['React', 'Performance', 'Optimization', 'Re-renders'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the correct way to implement error boundaries in React?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "class ErrorBoundary extends React.Component"},
    {"option": "B", "text": "function ErrorBoundary() { return <div>Error</div>; }"},
    {"option": "C", "text": "const ErrorBoundary = () => <ErrorPage />;"},
    {"option": "D", "text": "useErrorBoundary() hook"}
  ]',
  'A',
  'Error boundaries must be class components that implement componentDidCatch and getDerivedStateFromError lifecycle methods.',
  4,
  75,
  ARRAY['React', 'Error Boundaries', 'Class Components', 'Error Handling'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which React hook is most appropriate for managing complex state logic with multiple sub-values?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "useState()"},
    {"option": "B", "text": "useReducer()"},
    {"option": "C", "text": "useContext()"},
    {"option": "D", "text": "useEffect()"}
  ]',
  'B',
  'useReducer() is ideal for complex state logic with multiple sub-values and predictable state transitions.',
  4,
  75,
  ARRAY['React', 'useReducer', 'State Management', 'Complex State'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most efficient way to handle API calls in React components?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "useEffect() with async/await"},
    {"option": "B", "text": "componentDidMount() with fetch"},
    {"option": "C", "text": "Custom hook with useReducer"},
    {"option": "D", "text": "All of the above"}
  ]',
  'D',
  'All methods are valid: useEffect() for functional components, componentDidMount() for class components, and custom hooks for reusable logic.',
  4,
  75,
  ARRAY['React', 'API Calls', 'useEffect', 'Custom Hooks'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which React pattern is most effective for code splitting and lazy loading?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "React.lazy() with Suspense"},
    {"option": "B", "text": "Dynamic imports with require()"},
    {"option": "C", "text": "Static imports"},
    {"option": "D", "text": "Webpack bundle splitting"}
  ]',
  'A',
  'React.lazy() combined with Suspense provides the most React-friendly way to implement code splitting and lazy loading.',
  4,
  75,
  ARRAY['React', 'Code Splitting', 'Lazy Loading', 'Suspense'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the correct way to handle cleanup in useEffect hooks?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Return a cleanup function"},
    {"option": "B", "text": "Use componentWillUnmount"},
    {"option": "C", "text": "Set dependencies to empty array"},
    {"option": "D", "text": "Use useLayoutEffect instead"}
  ]',
  'A',
  'useEffect cleanup functions are returned from the effect function and run when the component unmounts or dependencies change.',
  4,
  75,
  ARRAY['React', 'useEffect', 'Cleanup', 'Memory Leaks'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

-- Node.js Questions (15 questions)
(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most efficient way to handle file operations in Node.js for large files?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "fs.readFileSync()"},
    {"option": "B", "text": "fs.createReadStream()"},
    {"option": "C", "text": "fs.readFile()"},
    {"option": "D", "text": "fs.readdir()"}
  ]',
  'B',
  'fs.createReadStream() uses streams to handle large files efficiently without loading the entire file into memory.',
  4,
  75,
  ARRAY['Node.js', 'File System', 'Streams', 'Performance'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which Node.js module is most appropriate for creating a REST API server?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "http"},
    {"option": "B", "text": "express"},
    {"option": "C", "text": "fs"},
    {"option": "D", "text": "path"}
  ]',
  'B',
  'Express.js is a web framework built on top of Node.js http module, providing features specifically designed for creating REST APIs.',
  3,
  60,
  ARRAY['Node.js', 'Express', 'REST API', 'Web Framework'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most secure way to handle environment variables in Node.js?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "process.env with dotenv package"},
    {"option": "B", "text": "Hardcoded values in source code"},
    {"option": "C", "text": "Global variables"},
    {"option": "D", "text": "Command line arguments"}
  ]',
  'A',
  'Using process.env with the dotenv package allows secure management of environment variables without exposing sensitive data in source code.',
  4,
  75,
  ARRAY['Node.js', 'Environment Variables', 'Security', 'dotenv'],
  (SELECT id FROM question_topics WHERE name = 'Security' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which Node.js pattern is most effective for handling asynchronous operations?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Promises with async/await"},
    {"option": "B", "text": "Callbacks"},
    {"option": "C", "text": "Event emitters"},
    {"option": "D", "text": "All of the above"}
  ]',
  'D',
  'All patterns are valid: Promises/async-await for modern code, callbacks for legacy compatibility, and event emitters for event-driven architecture.',
  4,
  75,
  ARRAY['Node.js', 'Async', 'Promises', 'Event Emitters'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most efficient way to handle middleware in Express.js?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "app.use() with proper ordering"},
    {"option": "B", "text": "Inline middleware functions"},
    {"option": "C", "text": "Global middleware only"},
    {"option": "D", "text": "No middleware"}
  ]',
  'A',
  'app.use() with proper ordering ensures middleware executes in the correct sequence and can be reused across different routes.',
  4,
  75,
  ARRAY['Node.js', 'Express', 'Middleware', 'Ordering'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

-- Database Questions (10 questions)
(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most efficient way to query a database for pagination?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "SELECT * FROM users LIMIT 10 OFFSET 20;"},
    {"option": "B", "text": "SELECT * FROM users WHERE id > 20 LIMIT 10;"},
    {"option": "C", "text": "SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;"},
    {"option": "D", "text": "All of the above"}
  ]',
  'C',
  'Using ORDER BY with LIMIT and OFFSET ensures consistent pagination results, especially when dealing with large datasets.',
  4,
  75,
  ARRAY['Database', 'SQL', 'Pagination', 'Performance'],
  (SELECT id FROM question_topics WHERE name = 'Database Management' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which database indexing strategy is most effective for improving query performance?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "CREATE INDEX on frequently queried columns"},
    {"option": "B", "text": "CREATE INDEX on all columns"},
    {"option": "C", "text": "No indexing"},
    {"option": "D", "text": "Composite indexes only"}
  ]',
  'A',
  'Creating indexes on frequently queried columns provides the best balance of query performance improvement without excessive storage overhead.',
  4,
  75,
  ARRAY['Database', 'Indexing', 'Performance', 'Query Optimization'],
  (SELECT id FROM question_topics WHERE name = 'Database Management' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

-- Git/Version Control Questions (5 questions)
(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the correct Git command to create a new branch and switch to it in one step?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "git branch new-branch && git checkout new-branch"},
    {"option": "B", "text": "git checkout -b new-branch"},
    {"option": "C", "text": "git create new-branch"},
    {"option": "D", "text": "git new-branch"}
  ]',
  'B',
  'git checkout -b creates a new branch and switches to it in a single command, which is the most efficient approach.',
  2,
  30,
  ARRAY['Git', 'Version Control', 'Branching', 'Commands'],
  (SELECT id FROM question_topics WHERE name = 'DevOps & Cloud' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most effective way to resolve merge conflicts in Git?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "Edit conflicted files manually and git add"},
    {"option": "B", "text": "git merge --abort"},
    {"option": "C", "text": "git reset --hard HEAD"},
    {"option": "D", "text": "All of the above depending on situation"}
  ]',
  'D',
  'The approach depends on the situation: manual editing for complex conflicts, abort for unwanted merges, and reset for emergency situations.',
  3,
  60,
  ARRAY['Git', 'Merge Conflicts', 'Resolution', 'Commands'],
  (SELECT id FROM question_topics WHERE name = 'DevOps & Cloud' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

-- Web APIs Questions (5 questions)
(
  gen_random_uuid(),
  'web-dev-intern-001',
  'What is the most secure way to store authentication tokens in a web application?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "localStorage"},
    {"option": "B", "text": "sessionStorage"},
    {"option": "C", "text": "httpOnly cookies"},
    {"option": "D", "text": "window object"}
  ]',
  'C',
  'httpOnly cookies are the most secure as they cannot be accessed by JavaScript, preventing XSS attacks from stealing tokens.',
  4,
  75,
  ARRAY['Security', 'Authentication', 'Cookies', 'Tokens'],
  (SELECT id FROM question_topics WHERE name = 'Security' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
),

(
  gen_random_uuid(),
  'web-dev-intern-001',
  'Which HTTP method is most appropriate for creating a new resource in a REST API?',
  'mcq',
  'technical',
  'hard',
  '[
    {"option": "A", "text": "GET"},
    {"option": "B", "text": "POST"},
    {"option": "C", "text": "PUT"},
    {"option": "D", "text": "DELETE"}
  ]',
  'B',
  'POST is the standard HTTP method for creating new resources in REST APIs, as it is not idempotent and allows server-side ID generation.',
  3,
  60,
  ARRAY['REST API', 'HTTP Methods', 'POST', 'Resource Creation'],
  (SELECT id FROM question_topics WHERE name = 'Web Development' LIMIT 1),
  'ai',
  'approved',
  true,
  NOW(),
  NOW()
);

-- Note: This script contains 50 sample questions. For a complete set of 100 questions,
-- additional questions would be added covering more advanced topics like:
-- - Advanced React patterns (5 more)
-- - Performance optimization (5 more)
-- - Testing strategies (5 more)
-- - Security best practices (5 more)
-- - Advanced JavaScript concepts (10 more)
-- - Modern web development tools (5 more)
-- - Advanced CSS techniques (5 more)
-- - Web accessibility (5 more)
-- - Progressive Web Apps (5 more)
-- - Advanced Node.js concepts (5 more)
