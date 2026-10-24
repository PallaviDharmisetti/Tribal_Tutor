/* script.js — Tribal Tutors interactive logic
   Features:
   - Sign-in / sign-up (localStorage)
   - Student multi-level tests + interests -> curriculum suggestion
   - Tutor verification + knowledge test -> tutor listing + certificate
   - Feedback, queries, donations saved to localStorage
   - Tutor directory rendering
   - Modal open/close utilities
*/

/* ----------------- Helpers ----------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const lsGet = (k, fallback) => JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback));
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const nowStr = () => new Date().toLocaleString();

/* ----------------- Modal utilities ----------------- */
function showModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  el.setAttribute('aria-hidden', 'false');
}
function hideModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
  el.setAttribute('aria-hidden', 'true');
}

/* Close modals when clicking outside panel */
document.addEventListener('click', (e) => {
  const modals = ['signin-modal','studentTestModal','tutorTestModal','certificateModal'];
  for (const id of modals) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (!el.classList.contains('show')) continue;
    // if clicked on overlay (modal with class show and target is the modal itself)
    if (e.target === el) hideModal(id);
  }
});

/* ----------------- App init & sample data ----------------- */
function initStorage() {
  if (!localStorage.getItem('tt_users')) lsSet('tt_users', []);
  if (!localStorage.getItem('tt_tutors')) {
    lsSet('tt_tutors', [
      { id: 1, name: 'Meena R', stream: 'Mathematics', verified: true, bio: 'Experienced community tutor', addedAt: nowStr() },
      { id: 2, name: 'Arun P', stream: 'Agriculture', verified: false, bio: 'Practical farming instructor', addedAt: nowStr() }
    ]);
  }
  if (!localStorage.getItem('tt_feedback')) lsSet('tt_feedback', []);
  if (!localStorage.getItem('tt_queries')) lsSet('tt_queries', []);
  if (!localStorage.getItem('tt_donations')) lsSet('tt_donations', []);
}
initStorage();

/* ----------------- Render tutors, feedback, queries, donations ----------------- */
function renderTutors() {
  const list = $('#tutorGrid');
  if (!list) return;
  const tutors = lsGet('tt_tutors', []);
  list.innerHTML = tutors.map(t => `
    <article class="tutor-card">
      <h3>${escapeHtml(t.name)}</h3>
      <p class="muted">${escapeHtml(t.stream)} • ${t.verified ? '<strong style="color:#16a34a">Verified</strong>' : '<span style="color:#f59e0b">Pending</span>'}</p>
      <p>${escapeHtml(t.bio || '')}</p>
      <div style="margin-top:10px">
        <button class="btn" onclick="messageTutor(${t.id})">Message</button>
      </div>
    </article>
  `).join('') || '<p class="muted">No tutors yet — invite people to sign up as tutors.</p>';
}
function renderFeedback() {
  const arr = lsGet('tt_feedback', []);
  const el = $('#feedbackList');
  if (!el) return;
  el.innerHTML = arr.map(f => `<div class="feedback-item"><strong>${escapeHtml(f.name||'Anonymous')}</strong> <small class="muted">${f.ts}</small><div>${escapeHtml(f.msg)}</div></div>`).join('');
}
function renderQueries() {
  const arr = lsGet('tt_queries', []);
  const el = $('#queryList');
  if (!el) return;
  el.innerHTML = arr.map(q => `<div class="query-item"><small class="muted">${q.ts}</small><div>${escapeHtml(q.msg)}</div></div>`).join('');
}
function renderDonations() {
  const arr = lsGet('tt_donations', []);
  const el = $('#donationList');
  if (!el) return;
  el.innerHTML = arr.map(d => `<div class="donation-item"><strong>${escapeHtml(d.name||'Anonymous')}</strong> donated <strong>₹${d.amount}</strong> <small class="muted">${d.ts}</small></div>`).join('');
}

/* ----------------- Escape HTML (simple) ----------------- */
function escapeHtml(s='') {
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

/* ----------------- Sign-in / Sign-up ----------------- */
function openSignIn() { showModal('signin-modal'); }
function closeSignIn() { hideModal('signin-modal'); }

const signupForm = $('#signupForm');
if (signupForm) {
  signupForm.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'suRole') {
      const val = e.target.value;
      $('#tutorExtra').style.display = val === 'tutor' ? 'block' : 'none';
    }
  });

  signupForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('#suName').value.trim();
    const email = $('#suEmail').value.trim();
    const role = $('#suRole').value;
    const stream = $('#suStream') ? $('#suStream').value : '';
    if (!name || !email) return alert('Please enter name and email.');
    const users = lsGet('tt_users', []);
    users.unshift({ name, email, role, stream, ts: nowStr() });
    lsSet('tt_users', users);
    $('#accountMsg').innerText = `Account created locally for ${name} (${role}).`;
    // if tutor, add to tutor pool as pending
    if (role === 'tutor') {
      const tutors = lsGet('tt_tutors', []);
      const newId = Date.now();
      tutors.unshift({ id: newId, name, stream: stream || 'General', verified: false, bio: 'New tutor — verification pending', addedAt: nowStr() });
      lsSet('tt_tutors', tutors);
      renderTutors();
    }
    signupForm.reset();
    $('#tutorExtra').style.display = 'none';
    // scroll to tutors
    setTimeout(() => scrollToSection('tutors'), 300);
  });
}

/* ----------------- Feedback, Queries, Donations ----------------- */
const fbForm = $('#feedbackForm');
if (fbForm) {
  fbForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#fbName').value.trim() || 'Anonymous';
    const msg = $('#fbMessage').value.trim();
    if (!msg) return alert('Please write a message.');
    const arr = lsGet('tt_feedback', []);
    arr.unshift({ name, msg, ts: nowStr() });
    lsSet('tt_feedback', arr);
    fbForm.reset();
    renderFeedback();
    alert('Thanks for your feedback!');
  });
}
const qForm = $('#queryForm');
if (qForm) {
  qForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('#queryMsg').value.trim();
    if (!msg) return alert('Please type your query.');
    const arr = lsGet('tt_queries', []);
    arr.unshift({ msg, ts: nowStr() });
    lsSet('tt_queries', arr);
    qForm.reset();
    renderQueries();
    alert('Your query has been submitted.');
  });
}
function processDonation(){
  const name = $('#donorName').value.trim() || 'Anonymous';
  const amount = Number($('#donorAmount').value);
  if (!amount || amount < 10) return alert('Enter an amount (min ₹10 for prototype).');
  const pool = lsGet('tt_donations', []);
  pool.unshift({ name, amount, ts: nowStr() });
  lsSet('tt_donations', pool);
  $('#donorName').value = ''; $('#donorAmount').value = '';
  renderDonations();
  alert(`Thank you ${name} for donating ₹${amount}! (Prototype)`);
}

/* ----------------- Tutors messaging placeholder ----------------- */
function messageTutor(id){
  const tutors = lsGet('tt_tutors', []);
  const t = tutors.find(x => x.id === id);
  if (!t) return alert('Tutor not found');
  alert(`Message placeholder — contact ${t.name} (stream: ${t.stream})`);
}

/* ----------------- Student tests (multi-level) ----------------- */
/* Question banks (4 questions per level for brevity) */
const studentBank = {
  Primary: [
    { q: '2 + 3 = ?', opts: ['4','5','6'], a: '5' },
    { q: 'Which is a fruit?', opts: ['Car', 'Apple', 'Stone'], a: 'Apple' },
    { q: 'Which color is sky?', opts: ['Blue','Green','Red'], a: 'Blue' },
    { q: 'Count: 1,2,3,?', opts: ['2','4','5'], a: '4' }
  ],
  Middle: [
    { q: '12 + 8 = ?', opts: ['20','18','22'], a: '20' },
    { q: 'Primary color among these?', opts: ['Purple','Green','Red'], a: 'Red' },
    { q: 'Water freezes at (°C)?', opts: ['0','50','100'], a: '0' },
    { q: 'Simple division: 15/3 = ?', opts: ['3','4','5'], a: '5' }
  ],
  High: [
    { q: 'Solve: 15 x 3 = ?', opts: ['45','35','40'], a: '45' },
    { q: 'Capital of India?', opts: ['Delhi','Mumbai','Kolkata'], a: 'Delhi' },
    { q: 'Which gas do plants release?', opts: ['Oxygen','Carbon dioxide'], a: 'Oxygen' },
    { q: 'What is 9^2?', opts: ['81','72','99'], a: '81' }
  ],
  College: [
    { q: 'Who created C language?', opts: ['Dennis Ritchie','Bjarne Stroustrup','James Gosling'], a: 'Dennis Ritchie' },
    { q: 'Binary of decimal 5 is?', opts: ['0101','1010','1111'], a: '0101' },
    { q: 'Which algorithm is O(log n)?', opts: ['Binary Search','Bubble Sort','Linear Search'], a: 'Binary Search' },
    { q: 'HTTP is for?', opts: ['Web','Files','Hardware'], a: 'Web' }
  ]
};

/* Open student test modal */
function openStudentTestModal() {
  // render level choice first
  const area = $('#studentTestContent');
  if (!area) return;
  area.innerHTML = `
    <div class="modal-card">
      <h3>Student Level Test</h3>
      <p>Select your level to begin a multi-question test</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
        <button class="btn" onclick="startStudentTest('Primary')">Primary</button>
        <button class="btn" onclick="startStudentTest('Middle')">Middle</button>
        <button class="btn" onclick="startStudentTest('High')">High School</button>
        <button class="btn" onclick="startStudentTest('College')">College</button>
      </div>
    </div>
  `;
  showModal('studentTestModal');
}

let currentStudent = { level: null, idx: 0, score: 0, answers: [] };

function startStudentTest(level) {
  currentStudent = { level, idx: 0, score: 0, answers: [] };
  renderStudentQuestion();
}

function renderStudentQuestion() {
  const bank = studentBank[currentStudent.level];
  const area = $('#studentTestContent');
  if (!bank || !area) return;
  if (currentStudent.idx >= bank.length) {
    // show results
    const score = currentStudent.score;
    area.innerHTML = `
      <div class="modal-card">
        <h3>Test complete</h3>
        <p>You scored <strong>${score}</strong> out of ${bank.length}</p>
        <p>We will generate a personalised curriculum based on your level and interests.</p>
        <div style="margin-top:12px">
          <button class="btn" onclick="chooseStudentInterest()">Choose interest & continue</button>
          <button class="btn ghost" onclick="closeStudentTestModal()">Close</button>
        </div>
      </div>
    `;
    return;
  }
  const q = bank[currentStudent.idx];
  area.innerHTML = `
    <div class="modal-card">
      <h3>${escapeHtml(currentStudent.level)} test — Q${currentStudent.idx+1} / ${bank.length}</h3>
      <p>${escapeHtml(q.q)}</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        ${q.opts.map(opt => `<button class="btn" onclick="answerStudent('${opt}')">${escapeHtml(opt)}</button>`).join('')}
      </div>
      <div style="margin-top:12px">
        <div class="muted">Progress</div>
        <div class="progress-bar" style="background:#e6f4ea;border-radius:8px;height:12px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#34d399,#60a5fa);width:${Math.round(((currentStudent.idx)/bank.length)*100)}%"></div>
        </div>
      </div>
    </div>
  `;
}
function answerStudent(ans) {
  const bank = studentBank[currentStudent.level];
  currentStudent.answers.push(ans);
  if (ans === bank[currentStudent.idx].a) currentStudent.score++;
  currentStudent.idx++;
  renderStudentQuestion();
}
function closeStudentTestModal() { hideModal('studentTestModal'); }

/* Interest selection, curriculum generation */
function chooseStudentInterest() {
  const area = $('#studentTestContent');
  area.innerHTML = `
    <div class="modal-card">
      <h3>Select your interest</h3>
      <p>Choose topics you'd like to learn (you can pick one now):</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['Math','Science','Technology','Arts','Languages'].map(i => `<button class="btn" onclick="generateCurriculum('${i}')">${i}</button>`).join('')}
      </div>
    </div>
  `;
}
function generateCurriculum(interest) {
  // create a simple curriculum based on level and interest
  const level = currentStudent.level;
  const curriculum = [
    `Intro to ${interest} (Basics)`,
    `${interest} — Practical activities`,
    `${interest} — Local examples & stories`,
    `Assessments & progress checks`
  ];
  // store result in localStorage under tt_student_profiles
  const profiles = lsGet('tt_student_profiles', []);
  profiles.unshift({ id: Date.now(), level, interest, curriculum, ts: nowStr() });
  lsSet('tt_student_profiles', profiles);
  $('#studentTestContent').innerHTML = `
    <div class="modal-card">
      <h3>Your Curriculum is Ready</h3>
      <p>Level: <strong>${escapeHtml(level)}</strong></p>
      <p>Interest: <strong>${escapeHtml(interest)}</strong></p>
      <ul>${curriculum.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
      <div style="margin-top:12px">
        <button class="btn" onclick="closeStudentTestModal()">Close</button>
        <button class="btn ghost" onclick="showStudentProfile()">View Profile</button>
      </div>
    </div>
  `;
}

/* small student profile view */
function showStudentProfile() {
  const profiles = lsGet('tt_student_profiles', []);
  const latest = profiles[0];
  if (!latest) return alert('No profile found.');
  $('#studentTestContent').innerHTML = `
    <div class="modal-card">
      <h3>Student Profile</h3>
      <p><strong>Level:</strong> ${escapeHtml(latest.level)}</p>
      <p><strong>Interest:</strong> ${escapeHtml(latest.interest)}</p>
      <h4>Curriculum</h4>
      <ul>${latest.curriculum.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul>
      <div style="margin-top:12px"><button class="btn" onclick="closeStudentTestModal()">Close</button></div>
    </div>
  `;
}

/* ----------------- Tutor verification & knowledge test ----------------- */
const tutorVerificationBank = [
  { q: 'Do you hold any recognised certificate in your teaching domain?', opts: ['Yes','No'], a: 'Yes' },
  { q: 'Are you willing to teach for local communities / outreach?', opts: ['Yes','No'], a: 'Yes' }
];
const tutorKnowledgeBank = [
  { q: 'What does HTML stand for?', opts: ['HyperText Markup Language','HighText Markup Level','Hyperlink Markup Lang'], a: 'HyperText Markup Language' },
  { q: 'Which of these is a way to explain a concept to beginners?', opts: ['Use examples','Give only theory','Skip basics'], a: 'Use examples' },
  { q: 'How would you assess a learner’s progress?', opts: ['Quizzes & projects','No checks','Only attendance'], a: 'Quizzes & projects' }
];

let currTutorTest = { idx: 0, phase: 'verification', answers: [], stream: null, name: null, bio: null };

function openTutorTestModal(){
  // prefill with simple form if not signed up
  const content = $('#tutorTestContent');
  content.innerHTML = `
    <div class="modal-card">
      <h3>Tutor Verification — Start</h3>
      <p>Enter your name and teaching stream to begin verification</p>
      <input id="ttName" placeholder="Your full name" />
      <input id="ttStream" placeholder="Your stream (Math, Agriculture, Crafts...)" />
      <textarea id="ttBio" placeholder="Short bio / experience"></textarea>
      <div style="margin-top:10px"><button class="btn" onclick="beginTutorTest()">Begin Test</button></div>
    </div>
  `;
  showModal('tutorTestModal');
}
function openTutorTestModalFromHeader(){ openTutorTestModal(); } // alias

function beginTutorTest(){
  const name = $('#ttName').value.trim();
  const stream = $('#ttStream').value.trim() || 'General';
  const bio = $('#ttBio').value.trim() || 'Community tutor';
  if (!name) return alert('Enter your name to continue.');
  currTutorTest = { idx: 0, phase: 'verification', answers: [], stream, name, bio };
  renderTutorQuestion();
}

function renderTutorQuestion() {
  const content = $('#tutorTestContent');
  if (!content) return;
  let bank = currTutorTest.phase === 'verification' ? tutorVerificationBank : tutorKnowledgeBank;
  if (currTutorTest.idx >= bank.length) {
    if (currTutorTest.phase === 'verification') {
      // move to knowledge
      currTutorTest.phase = 'knowledge';
      currTutorTest.idx = 0;
      renderTutorQuestion();
      return;
    } else {
      // finished both
      finalizeTutorTest();
      return;
    }
  }
  const q = bank[currTutorTest.idx];
  content.innerHTML = `
    <div class="modal-card">
      <h3>${currTutorTest.phase === 'verification' ? 'Verification' : 'Knowledge'} Test (${currTutorTest.idx+1}/${bank.length})</h3>
      <p>${escapeHtml(q.q)}</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        ${q.opts.map(o => `<button class="btn" onclick="answerTutor('${escapeHtml(o)}')">${escapeHtml(o)}</button>`).join('')}
      </div>
      <div style="margin-top:12px">
        <div class="muted">Progress</div>
        <div style="height:10px;background:#f0fdf4;border-radius:6px;overflow:hidden">
          <div style="width:${Math.round(((currTutorTest.idx)/(bank.length))*100)}%;height:100%;background:linear-gradient(90deg,#34d399,#60a5fa)"></div>
        </div>
      </div>
    </div>
  `;
}

function answerTutor(choice) {
  currTutorTest.answers.push(choice);
  currTutorTest.idx++;
  renderTutorQuestion();
}

function finalizeTutorTest() {
  // evaluate knowledge part only (last bank length)
  const startIndex = tutorVerificationBank.length;
  let knowledgeScore = 0;
  for (let i = 0; i < tutorKnowledgeBank.length; i++) {
    const userAns = currTutorTest.answers[startIndex + i];
    if (userAns === tutorKnowledgeBank[i].a) knowledgeScore++;
  }
  const verified = knowledgeScore >= Math.ceil(tutorKnowledgeBank.length * 0.6); // 60% pass
  // add to tutor pool
  const tutors = lsGet('tt_tutors', []);
  const newTutor = { id: Date.now(), name: currTutorTest.name, stream: currTutorTest.stream, verified, bio: currTutorTest.bio, addedAt: nowStr() };
  tutors.unshift(newTutor);
  lsSet('tt_tutors', tutors);
  renderTutors();
  // show certificate or pending message
  const certArea = $('#certificateContent');
  if (!certArea) return;
  if (verified) {
    certArea.innerHTML = `
      <div class="modal-card">
        <h3>Congratulations, ${escapeHtml(currTutorTest.name)}!</h3>
        <p>You passed the tutor knowledge check with score ${knowledgeScore}/${tutorKnowledgeBank.length} and are marked <strong style="color:#16a34a">Verified</strong>.</p>
        <div style="margin-top:10px"><button class="btn" onclick="closeCertificateModal()">Close</button></div>
      </div>
    `;
  } else {
    certArea.innerHTML = `
      <div class="modal-card">
        <h3>Verification pending</h3>
        <p>Your knowledge score: ${knowledgeScore}/${tutorKnowledgeBank.length}. Please review the resources and try again.</p>
        <div style="margin-top:10px"><button class="btn" onclick="closeCertificateModal()">Close</button></div>
      </div>
    `;
  }
  hideModal('tutorTestModal');
  showModal('certificateModal');
}

function closeTutorTestModal() { hideModal('tutorTestModal'); }
function closeCertificateModal() { hideModal('certificateModal'); }

/* ----------------- Course flow placeholder ----------------- */
function startCourseFlow(id) {
  alert(`Course flow placeholder: starting course "${id}". This demo builds curriculum with tests.`);
  // In a real app, would open course modules & track progress
}

/* ----------------- Small utility functions ----------------- */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ----------------- Initial render on load ----------------- */
document.addEventLi