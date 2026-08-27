import { LessonNote, LessonFeedback } from '../types';

export const INITIAL_LESSON_NOTES: LessonNote[] = [
  // ==========================================
  // SECONDARY COLLEGE ARM (SSS & JSS)
  // ==========================================
  {
    id: 'note-sec-001',
    title: 'Electromagnetic Waves & Optical Spectrum',
    subjectId: 'sub-phy-sss2',
    subjectName: 'Physics',
    classLevel: 'SSS 2 Science',
    arm: 'secondary',
    term: '2nd Term',
    academicYear: '2025/2026',
    weekNumber: 5,
    teacherId: 'staff-eng-001',
    teacherName: 'Engr. Terver Akume (M.Sc Physics)',
    topic: 'Electromagnetic Spectrum & Total Internal Reflection in Optics',
    subTopics: [
      'Components of the Electromagnetic Spectrum and their Wavelengths',
      'Refraction and Snell\'s Law in Dense Media',
      'Critical Angle and Conditions for Total Internal Reflection (TIR)',
      'Practical Applications: Optical Fibre Cables, Endoscopes and Prismatic Binoculars'
    ],
    learningObjectives: [
      'Define electromagnetic waves and arrange components in order of increasing frequency.',
      'Derive and state Snell\'s law: n1 * sin(θ1) = n2 * sin(θ2).',
      'Explain the conditions required for Total Internal Reflection to occur.',
      'Solve numerical problems involving critical angles and refractive indices of glass prisms (n = 1.5).'
    ],
    instructionalMaterials: [
      'Rectangular and Triangular Glass Prisms',
      'Optical Ray Box with Collimated Slits',
      'Laser Pointer and Semi-Circular Glass Block',
      'Protractor and Optical Pins'
    ],
    contentSummary: 'This comprehensive module explores wave propagation across the optical spectrum, mathematical formulation of critical angles, and industrial application in fibre-optic telecommunications.',
    contentBody: `1. INTRODUCTION TO ELECTROMAGNETIC WAVES
Electromagnetic waves are transverse waves produced by accelerating electric charges that propagate through a vacuum at the speed of light (c = 3.0 × 10^8 m/s). 

Order of Spectrum (Decreasing Wavelength / Increasing Frequency):
• Radio Waves -> Microwaves -> Infrared Radiation -> Visible Light -> Ultraviolet -> X-Rays -> Gamma Rays.

2. REFRACTION OF LIGHT & SNELL'S LAW
When light passes from an optically less dense medium (air, n ≈ 1.00) to an optically denser medium (glass, n ≈ 1.50 or water, n ≈ 1.33), it slows down and bends toward the normal.
According to Snell's Law:
n = sin(i) / sin(r)
Where i = Angle of Incidence, r = Angle of Refraction.

3. CRITICAL ANGLE (c) & TOTAL INTERNAL REFLECTION (TIR)
The Critical Angle is the angle of incidence in the denser medium for which the angle of refraction in the less dense medium is exactly 90 degrees.

Formula:
sin(c) = 1 / n  (where n is the refractive index of the denser medium relative to air)

Conditions for Total Internal Reflection:
a) The light ray must travel from an optically denser medium to an optically less dense medium.
b) The angle of incidence (i) must exceed the critical angle (c).

4. WORKED EXAMPLE:
Calculate the critical angle for crown glass having a refractive index n = 1.52.
Solution:
sin(c) = 1 / 1.52 = 0.6579
c = arcsin(0.6579) = 41.14°

5. INDUSTRIAL & MEDICAL APPLICATIONS
- Optical Fibre Telecommunications: Data is transmitted as high-frequency laser pulses guided through glass cores with almost zero attenuation via consecutive Total Internal Reflections.
- Medical Endoscopy: Doctors inspect internal organs without invasive surgery using flexible optical fibre bundles.`,
    evaluationQuestions: [
      'Question 1: State two fundamental differences between sound waves and electromagnetic light waves.',
      'Question 2: A ray of light travels from water (n = 1.33) into air. Calculate the critical angle for water.',
      'Question 3: Explain why diamonds sparkle with intense brilliance using the concept of critical angle (n = 2.42).',
      'Question 4 (Homework): A 45°-45°-90° glass prism is used in binoculars. Sketch the ray diagram showing how light is deviated through 90° and 180° by total internal reflection.'
    ],
    pdfFileName: 'SSS2_Physics_Week5_EM_Waves_Optics.pdf',
    pdfFileSize: '2.4 MB',
    uploadedAt: '2026-02-16 08:30 AM',
    downloadCount: 48,
    status: 'Published',
    keyTerms: ['Electromagnetic Spectrum', 'Snell\'s Law', 'Critical Angle', 'Total Internal Reflection', 'Optical Fibre']
  },
  {
    id: 'note-sec-002',
    title: 'Algebraic Quadratic Equations & Completing the Square',
    subjectId: 'sub-mth-sss1',
    subjectName: 'General Mathematics',
    classLevel: 'SSS 1 Science',
    arm: 'secondary',
    term: '2nd Term',
    academicYear: '2025/2026',
    weekNumber: 4,
    teacherId: 'staff-mth-001',
    teacherName: 'Mr. Emmanuel Agbo (B.Sc Ed Mathematics)',
    topic: 'Quadratic Equations: Factorisation and Completing the Square Method',
    subTopics: [
      'General form of Quadratic Equation: ax² + bx + c = 0',
      'Factorisation of trinomials with integer roots',
      'Step-by-step procedure of Completing the Square',
      'Derivation of the Quadratic Formula (-b ± √(b² - 4ac)) / 2a'
    ],
    learningObjectives: [
      'Identify quadratic expressions and standard quadratic equations.',
      'Solve quadratic equations by finding suitable factor pairs.',
      'Master the 5-step method of completing the square when a = 1 and a > 1.',
      'Apply quadratic equations to real-life word problems involving area and velocity.'
    ],
    instructionalMaterials: [
      'Algebra Tiles and Graphical Grid Boards',
      'Scientific Calculators',
      'WAEC Past Questions Revision Compendium (2018–2025)'
    ],
    contentSummary: 'Detailed step-by-step guide with 6 worked examples on solving non-linear algebraic equations, completing squares, and discriminant analysis.',
    contentBody: `1. DEFINITION
A quadratic equation is a second-degree polynomial equation in a single variable x with the general form:
ax² + bx + c = 0 (where a ≠ 0, and a, b, c are real constants).

2. METHOD 1: FACTORISATION
Example: Solve x² - 5x + 6 = 0
Find two numbers whose product is +6 and sum is -5.
The numbers are -2 and -3.
(x - 2)(x - 3) = 0
Therefore: x = 2 or x = 3.

3. METHOD 2: COMPLETING THE SQUARE
For equations where simple factors are not obvious (such as surd or irrational roots):
Step 1: Write equation in form ax² + bx = -c
Step 2: If a ≠ 1, divide all terms by a.
Step 3: Add the square of half the coefficient of x, which is [b/(2a)]², to both sides.
Step 4: Factor the left side as a perfect square: (x + b/2a)².
Step 5: Take the square root of both sides and solve for x.

4. WORKED EXAMPLE (a > 1):
Solve: 2x² + 5x - 3 = 0
Divide by 2: x² + (5/2)x = 3/2
Add [ (5/2)/2 ]² = (5/4)² = 25/16 to both sides:
x² + (5/2)x + 25/16 = 3/2 + 25/16
(x + 5/4)² = (24 + 25)/16 = 49/16
Take square roots:
x + 5/4 = ± 7/4
x = -5/4 + 7/4 = 2/4 = 1/2
OR
x = -5/4 - 7/4 = -12/4 = -3
Roots: x = 1/2, x = -3.`,
    evaluationQuestions: [
      '1. Solve by completing the square: x² + 6x - 7 = 0',
      '2. Solve by the quadratic formula: 3x² - 10x + 3 = 0',
      '3. The length of a rectangular school garden is 4 metres longer than its width. If its total area is 96 m², find the perimeter.',
      '4. For what values of k does the equation x² + kx + 16 = 0 have equal roots?'
    ],
    pdfFileName: 'SSS1_Mathematics_Week4_Quadratic_Equations.pdf',
    pdfFileSize: '1.8 MB',
    uploadedAt: '2026-02-14 10:15 AM',
    downloadCount: 65,
    status: 'Published',
    keyTerms: ['Quadratic Equation', 'Completing the Square', 'Discriminant', 'Roots', 'Algebraic Factorisation']
  },
  {
    id: 'note-sec-003',
    title: 'Financial Accounting: Trial Balance & Error Corrections',
    subjectId: 'sub-acc-sss2',
    subjectName: 'Financial Accounting',
    classLevel: 'SSS 2 Commercial',
    arm: 'secondary',
    term: '2nd Term',
    academicYear: '2025/2026',
    weekNumber: 5,
    teacherId: 'staff-bursar-001',
    teacherName: 'Mrs. Victoria Oche (B.Sc Accounting, ACA)',
    topic: 'Preparation of Trial Balance and Treatment of Suspense Accounts',
    subTopics: [
      'Definition and Objectives of the Trial Balance',
      'Rules of Debit and Credit posting from General Ledger',
      'Errors that do NOT affect Trial Balance agreement (Omission, Commission, Principle, etc.)',
      'Errors that DO affect agreement and creation of Suspense Account'
    ],
    learningObjectives: [
      'Extract ledger balances and construct a balanced Trial Balance.',
      'Distinguish between errors of principle, omission, commission, and compensating errors.',
      'Open and balance a Suspense Account to correct one-sided errors.',
      'Draft corrected Final Accounts after ledger rectifications.'
    ],
    instructionalMaterials: [
      'Standard Ledger Books & Multi-column Journal Sheets',
      'WAEC Commercial Past Paper Solutions'
    ],
    contentSummary: 'Core guide for commercial students covering trial balance balancing, error classifications, and journal entries for correcting bookkeeping discrepancies.',
    contentBody: `1. PURPOSE OF TRIAL BALANCE
A Trial Balance is a statement showing the debit and credit balances extracted from the ledger accounts on a particular date to verify arithmetic accuracy of double-entry postings.

2. ERRORS NOT DISCLOSED BY THE TRIAL BALANCE:
- Error of Omission: A transaction is completely missed in both books.
- Error of Commission: An entry is posted to the correct side but in the wrong personal account (e.g. debited to J. Musa instead of J. Audu).
- Error of Principle: An entry violates fundamental accounting principles (e.g. treating capital expenditure as revenue expenditure).
- Error of Original Entry: An incorrect figure is entered in source documents and subsequently posted correctly according to the error.
- Compensating Errors: Errors on the debit side are equalized by errors on the credit side.

3. ERRORS DISCLOSED BY THE TRIAL BALANCE & SUSPENSE ACCOUNT:
When the total of debits does not equal total credits due to casting errors, single-entry posting, or unequal entries:
The difference is temporarily lodged into a 'Suspense Account' until investigated and rectified via Journal Vouchers.`,
    evaluationQuestions: [
      '1. Define a Trial Balance and list three key limitations of relying solely on its agreement.',
      '2. Differentiate between an error of principle and an error of commission with illustrative examples.',
      '3. A bookkeeper posted motor vehicle purchase of N500,000 to Motor Expenses Account. Write the journal entry to correct this error.',
      '4. Show how a suspense account is created and cleared with sample ledger entries.'
    ],
    pdfFileName: 'SSS2_Accounting_Week5_Trial_Balance_Suspense.pdf',
    pdfFileSize: '2.1 MB',
    uploadedAt: '2026-02-15 02:20 PM',
    downloadCount: 39,
    status: 'Published',
    keyTerms: ['Trial Balance', 'Double Entry', 'Suspense Account', 'Error of Principle', 'Ledger Extraction']
  },

  // ==========================================
  // PRIMARY SCHOOL / BASIC EDUCATION ARM
  // ==========================================
  {
    id: 'note-pri-001',
    title: 'Basic Science: Water Cycle & Environmental Sanitation',
    subjectId: 'sub-sci-bas4',
    subjectName: 'Basic Science & Technology',
    classLevel: 'Basic 4',
    arm: 'primary',
    term: '2nd Term',
    academicYear: '2025/2026',
    weekNumber: 5,
    teacherId: 'staff-pri-002',
    teacherName: 'Mrs. Rebecca Tyover (B.Ed Science Education)',
    topic: 'The Earth\'s Water Cycle: Evaporation, Condensation and Precipitation',
    subTopics: [
      'States of Matter in Water (Solid ice, Liquid water, Gaseous water vapour)',
      'The Continuous Stages of the Natural Water Cycle',
      'Sources of Clean and Contaminated Water',
      'Safe Water Purification Techniques (Boiling, Filtration, Chlorination)'
    ],
    learningObjectives: [
      'Describe the three processes of evaporation, condensation, and precipitation.',
      'Identify the sun as the main energy driver of the water cycle.',
      'Explain why rain falls and where river water comes from.',
      'Demonstrate how dirty water can be made safe for drinking at home.'
    ],
    instructionalMaterials: [
      'Kettle, Ice Cubes and Cold Metal Plate (Water Cycle Simulation)',
      'Colourful Wall Charts of the Global Water Cycle',
      'Sand-Charcoal DIY Water Filter Demonstration Kit'
    ],
    contentSummary: 'Engaging, visual, and activity-packed science lesson note explaining how rain forms, why clean water is essential, and home filtration methods.',
    contentBody: `1. WHAT IS THE WATER CYCLE?
The Water Cycle is the continuous journey water takes from the earth to the sky and back again to the earth. God made this wonderful cycle so the earth never runs out of fresh water!

2. THE THREE MAIN STAGES:
a) Evaporation (Liquid to Gas):
When the hot sun shines on oceans, rivers, and puddles, the water warms up and turns into invisible gas called 'Water Vapour'. It floats up into the sky.

b) Condensation (Gas to Liquid):
High up in the sky, it is very cold. The water vapour cools down and joins tiny dust particles to form fluffy white Clouds!

c) Precipitation (Rain Falling):
When the clouds become too heavy with water droplets, they fall back to the ground as RAIN, Hail, or Dew.

d) Collection:
Rainwater flows into rivers, lakes, oceans, and sinks into the ground as well-water, ready to start the cycle all over again!

3. HOW TO MAKE WATER SAFE FOR DRINKING:
- Boiling: Boil water for at least 10 minutes to kill harmful germs.
- Filtration: Pass water through clean sand, charcoal, and cloth to remove dirt particles.
- Chlorination: Use safe water purification tablets (WaterGuard).`,
    evaluationQuestions: [
      '1. What are the three main stages of the water cycle?',
      '2. What causes water on the ground to evaporate into the sky?',
      '3. Why is it dangerous to drink untreated flood or river water?',
      '4. Activity for Home: With your parents, place a shallow bowl of water outside on a sunny afternoon. Measure the water level before and after 4 hours. Write down what happened!'
    ],
    pdfFileName: 'Basic4_Basic_Science_Week5_Water_Cycle.pdf',
    pdfFileSize: '3.1 MB',
    uploadedAt: '2026-02-16 09:00 AM',
    downloadCount: 82,
    status: 'Published',
    keyTerms: ['Water Cycle', 'Evaporation', 'Condensation', 'Precipitation', 'Safe Drinking Water']
  },
  {
    id: 'note-pri-002',
    title: 'Mathematics: Operations on Fractions and Decimals',
    subjectId: 'sub-mth-bas5',
    subjectName: 'Mathematics',
    classLevel: 'Basic 5',
    arm: 'primary',
    term: '2nd Term',
    academicYear: '2025/2026',
    weekNumber: 5,
    teacherId: 'staff-pri-001',
    teacherName: 'Mrs. Grace Iveren Shima (Headmistress & Lead Numeracy Tutor)',
    topic: 'Addition, Subtraction and Conversion of Proper and Improper Fractions',
    subTopics: [
      'Review of Numerator, Denominator and Equivalent Fractions',
      'Lowest Common Multiple (LCM) Method for Unlike Denominators',
      'Converting Mixed Numbers to Improper Fractions and Vice Versa',
      'Word problems involving sharing food, money, and time'
    ],
    learningObjectives: [
      'Find the LCM of denominators rapidly to add and subtract fractions.',
      'Convert 3 3/4 into 15/4 and 22/7 into 3 1/7 accurately.',
      'Solve two-step fraction word problems.',
      'Express simple fractions as decimals (1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75).'
    ],
    instructionalMaterials: [
      'Fraction Pies and Fraction Stacking Bars',
      'Metric Rulers and Cardboard Cut-outs',
      'National Common Entrance Past Questions (2020–2025)'
    ],
    contentSummary: 'Standard Universal Basic Education (UBE) primary numeracy guide with clear fraction conversion rules, LCM drills, and NCEE practice items.',
    contentBody: `1. BASIC CONCEPTS
A fraction represents a part of a whole.
Fraction = Numerator (Top) / Denominator (Bottom).

Types of Fractions:
- Proper Fraction: Numerator < Denominator (e.g. 3/5)
- Improper Fraction: Numerator >= Denominator (e.g. 7/4)
- Mixed Fraction: Whole number + Proper fraction (e.g. 2 1/3)

2. ADDITION OF FRACTIONS WITH UNLIKE DENOMINATORS:
Example: Calculate 2/3 + 1/4
Step 1: Find the LCM of denominators 3 and 4.
LCM of 3 and 4 = 12.
Step 2: Convert to equivalent fractions with denominator 12:
(2 × 4)/12 + (1 × 3)/12 = 8/12 + 3/12
Step 3: Add numerators:
(8 + 3) / 12 = 11/12.

3. SUBTRACTION WITH MIXED NUMBERS:
Example: Solve 4 1/2 - 1 3/4
Method: Convert to improper fractions:
4 1/2 = 9/2
1 3/4 = 7/4
LCM of 2 and 4 is 4:
(9 × 2)/4 - 7/4 = 18/4 - 7/4 = 11/4 = 2 3/4.`,
    evaluationQuestions: [
      '1. Simplify: 3/5 + 2/7',
      '2. Subtract: 5 1/3 - 2 5/6',
      '3. Emmanuella had N1,200. She spent 1/4 on books and 1/3 on transport. How much money does she have left?',
      '4. Convert the following fractions to decimals: (a) 3/4  (b) 2/5  (c) 7/10'
    ],
    pdfFileName: 'Basic5_Mathematics_Week5_Fractions_Decimals.pdf',
    pdfFileSize: '2.0 MB',
    uploadedAt: '2026-02-15 11:30 AM',
    downloadCount: 94,
    status: 'Published',
    keyTerms: ['Fractions', 'Numerator', 'Denominator', 'LCM', 'Mixed Numbers']
  },

  // ==========================================
  // EARLY CHILDHOOD / KINDERGARTEN ARM
  // ==========================================
  {
    id: 'note-kg-001',
    title: 'Phonics: Jolly Phonics Letter Sounds Group 3 (g, o, u, l, f, b)',
    subjectId: 'sub-pho-kg2',
    subjectName: 'Phonics & Early Literacy',
    classLevel: 'KG 2',
    arm: 'kindergarten',
    term: '2nd Term',
    academicYear: '2025/2026',
    weekNumber: 5,
    teacherId: 'staff-kg-001',
    teacherName: 'Mrs. Abigail Balogun (Head of Early Years & Montessori Directress)',
    topic: 'Letter Sound Recognition, Blending CVC Words (bed, fog, sun, log)',
    subTopics: [
      'Multisensory Letter Sound Action Songs (Sounds: /g/, /o/, /u/, /l/, /f/, /b/)',
      'Tracing Letter Shapes in Sand Trays & Playdough',
      'Sound Blending for 3-Letter Words (CVC - Consonant Vowel Consonant)',
      'Picture-Sound Matching and Sight Words Introduction'
    ],
    learningObjectives: [
      'Identify and articulate the correct phonetic sound for g, o, u, l, f, b without letter naming.',
      'Blend 3 sounds together smoothly to read simple words like "b-a-g", "f-o-g", "s-u-n".',
      'Demonstrate fine motor grip while tracing letter contours with crayons.',
      'Recognise initial sounds in everyday objects around the home and classroom.'
    ],
    instructionalMaterials: [
      'Montessori Sandpaper Letters',
      'Jolly Phonics Big Picture Books and Audio Sound Jingles',
      'Magnetic Wooden Letters and Sound Pouch Toys'
    ],
    contentSummary: 'Montessori-aligned early reading and phonics note with songs, physical actions, CVC word blending, and parent-child reading flashcards.',
    contentBody: `1. DEAR PARENTS & GUARDIANS:
In Early Years Literacy, we teach the SOUND of letters (e.g. /b/ as in 'ball') rather than letter names ('Bee') so children can start blending words to read independently!

2. THIS WEEK'S LETTER SOUNDS & ACTIONS:
• Letter 'g': Spiral your hand down like water gurgling down a drain: /g/, /g/, /g/ (as in 'girl', 'gate', 'goat').
• Letter 'o': Pretend to flick an electric light switch on and off: /o/, /o/, /o/ (as in 'orange', 'octopus', 'on').
• Letter 'u': Pretend to open an umbrella up: /u/, /u/, /u/ (as in 'umbrella', 'up', 'under').
• Letter 'l': Pretend to lick a sweet lollipop: /l/, /l/, /l/ (as in 'lollipop', 'lion', 'leaf').
• Letter 'f': Let your hands float down like a deflating fish or ball: /f/, /f/, /f/ (as in 'fish', 'fan', 'frog').
• Letter 'b': Swing an imaginary bat to hit a ball: /b/, /b/, /b/ (as in 'bat', 'bag', 'bed').

3. WORD BLENDING FUN (Read with your child):
- b - u - g = BUG
- f - o - g = FOG
- l - o - g = LOG
- b - e - d = BED
- s - u - n = SUN`,
    evaluationQuestions: [
      'Parent Activity 1: Point to items in the kitchen (e.g. cup, pot, bag, fan) and ask your child: "What is the very first sound you hear?"',
      'Parent Activity 2: Practice sounding out these words together: (1) b-o-x  (2) f-u-n  (3) l-e-g',
      'Parent Activity 3: Have your child trace the letters g, o, u, l, f, b using colourful crayons in their handwriting workbook (Pages 18-20).'
    ],
    pdfFileName: 'KG2_Jolly_Phonics_Week5_Letter_Sounds.pdf',
    pdfFileSize: '4.2 MB',
    uploadedAt: '2026-02-15 08:00 AM',
    downloadCount: 110,
    status: 'Published',
    keyTerms: ['Phonics', 'Letter Sounds', 'CVC Words', 'Sound Blending', 'Montessori Reading']
  }
];

export const INITIAL_LESSON_FEEDBACKS: LessonFeedback[] = [
  {
    id: 'fb-001',
    lessonNoteId: 'note-sec-001',
    parentName: 'Mr. David O. Okafor',
    studentName: 'Chidera Okafor (SSS 2 Science)',
    guardianPhone: '+234 803 111 2233',
    question: 'Good day Engr. Akume, could you please clarify why total internal reflection only happens when light goes from glass to air and not from air into glass?',
    reply: 'Hello Mr. Okafor! Light must travel from a denser medium (glass) to a rarer one (air) so the ray bends AWAY from the normal. When the incident angle exceeds the critical angle, the ray has nowhere further to refract and is trapped inside as a reflection!',
    repliedBy: 'Engr. Terver Akume',
    createdAt: '2026-02-16 02:45 PM',
    status: 'Answered'
  },
  {
    id: 'fb-002',
    lessonNoteId: 'note-pri-002',
    parentName: 'Mrs. Patience Beeun',
    studentName: 'Emmanuella Beeun (Basic 5)',
    guardianPhone: '+234 811 523 1834',
    question: 'Mrs. Shima, thank you for the fraction notes. Emmanuella was able to finish questions 1 and 2 easily. We will review question 3 before Monday\'s test.',
    reply: 'Wonderful feedback Mrs. Beeun! Emmanuella is doing exceptionally well. Question 3 tests two-step fraction division which we will also recap during our Monday morning clinic.',
    repliedBy: 'Mrs. Grace Iveren Shima',
    createdAt: '2026-02-16 05:10 PM',
    status: 'Answered'
  }
];
