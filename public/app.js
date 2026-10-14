const $ = (id) => document.getElementById(id);

const courseImages = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80"
];

let courses = [];
let students = [];
let registrations = [];
let toastTimer;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[ch]);
}
function notify(message, isError = false) {
  const toast = $("toast");
  toast.textContent = message;
  toast.className = `toast show${isError ? " error" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.className = "toast", 3500);
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed. Please try again.");
  return data;
}
function showView(viewId) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active-view", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === viewId));
  const activeButton = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  $("crumbTitle").textContent = activeButton ? activeButton.textContent.trim() : "Overview";
  if (viewId === "records") loadRegistrations();
  if (viewId === "admin") renderAdminCourses();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
document.querySelectorAll("[data-jump]").forEach(button => button.addEventListener("click", (event) => {
  event.preventDefault();
  showView(button.dataset.jump);
}));

function imageFor(course, index = 0) {
  const text = `${course.course_code} ${course.course_name} ${course.department}`.toLowerCase();
  if (/ai|data|computer|web|cloud|database|software|program/.test(text)) return courseImages[(index + 0) % courseImages.length];
  if (/math|statistic/.test(text)) return courseImages[3];
  if (/electronic|electrical|digital/.test(text)) return courseImages[4];
  return courseImages[index % courseImages.length];
}
function courseCard(course, index) {
  return `<article class="course-card">
    <div class="course-cover"><img src="${imageFor(course, index)}" alt="" loading="lazy" onerror="this.style.display='none'"><span class="course-badge">${escapeHtml(course.course_code)}</span></div>
    <div class="course-card-body"><div class="course-code">${escapeHtml(course.department.toUpperCase())}</div>
      <h3>${escapeHtml(course.course_name)}</h3><div class="course-dept">${escapeHtml(course.department)}</div>
      <div class="course-meta"><span>Semester <strong>${escapeHtml(course.semester)}</strong></span><span><strong>${escapeHtml(course.credits)}</strong> credits</span></div>
      <div class="course-card-foot"><span class="course-dept">Build your skills ✦</span><button data-register-course="${course.course_id}">Register ↗</button></div>
    </div></article>`;
}
function renderCourses() {
  $("featuredCourses").innerHTML = courses.slice(0, 3).map(courseCard).join("") || '<p class="empty-cell">No courses available yet. Add a course in Course administration.</p>';
  filterCatalog();
  renderAdminCourses();
  $("statCourses").textContent = courses.length;
  $("adminCourseCount").textContent = courses.length;
  const uniqueStudents = new Set(registrations.map(r => r.student_id));
  $("statStudents").textContent = uniqueStudents.size;
  $("statRegistrations").textContent = registrations.length;
  document.querySelectorAll("[data-register-course]").forEach(button => button.addEventListener("click", () => {
    $("registerCourseSelect").value = button.dataset.registerCourse;
    updateCoursePreview();
    showView("register");
  }));
}
function filterCatalog() {
  const query = ($("courseSearch")?.value || "").toLowerCase().trim();
  const semester = $("semesterFilter")?.value || "";
  const department = $("departmentFilter")?.value || "";
  const filtered = courses.filter(course =>
    `${course.course_code} ${course.course_name} ${course.department}`.toLowerCase().includes(query) &&
    (!semester || String(course.semester) === semester) &&
    (!department || course.department === department)
  );
  $("catalogCount").textContent = `${filtered.length} course${filtered.length === 1 ? "" : "s"} found`;
  $("catalogCourses").innerHTML = filtered.map(courseCard).join("") || '<p class="empty-cell">No courses match those filters. Try another search.</p>';
  document.querySelectorAll("[data-register-course]").forEach(button => button.addEventListener("click", () => {
    $("registerCourseSelect").value = button.dataset.registerCourse;
    updateCoursePreview();
    showView("register");
  }));
}
function populateDepartments() {
  const selected = $("departmentFilter").value;
  const departments = [...new Set(courses.map(c => c.department))].sort();
  $("departmentFilter").innerHTML = '<option value="">All departments</option>' +
    departments.map(dept => `<option value="${escapeHtml(dept)}">${escapeHtml(dept)}</option>`).join("");
  $("departmentFilter").value = departments.includes(selected) ? selected : "";
}
function populateStudents() {
  const currentRegister = $("studentSelect").value;
  const currentFilter = $("recordsStudentFilter").value;
  const options = students.map(s => `<option value="${s.student_id}">${escapeHtml(s.name)} — ${escapeHtml(s.roll_no)}</option>`).join("");
  $("studentSelect").innerHTML = '<option value="">Choose a student</option>' + options;
  $("recordsStudentFilter").innerHTML = '<option value="">All students</option>' + options;
  if (students.some(s => String(s.student_id) === currentRegister)) $("studentSelect").value = currentRegister;
  if (students.some(s => String(s.student_id) === currentFilter)) $("recordsStudentFilter").value = currentFilter;
  updateStudentPreview();
}
function populateRegistrationCourses() {
  const current = $("registerCourseSelect").value;
  $("registerCourseSelect").innerHTML = '<option value="">Choose an available course</option>' +
    courses.map(c => `<option value="${c.course_id}">${escapeHtml(c.course_code)} — ${escapeHtml(c.course_name)} (Sem ${c.semester})</option>`).join("");
  if (courses.some(c => String(c.course_id) === current)) $("registerCourseSelect").value = current;
  updateCoursePreview();
}
function updateStudentPreview() {
  const student = students.find(s => String(s.student_id) === $("studentSelect").value);
  $("studentPreview").innerHTML = student
    ? `<div class="preview-avatar">${escapeHtml(student.name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join("").toUpperCase())}</div><div><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.roll_no)} · ${escapeHtml(student.branch)} · ${escapeHtml(student.email)}</small></div>`
    : '<div class="preview-avatar">✦</div><div><strong>Student details will appear here</strong><small>Select a student profile above</small></div>';
}
function updateCoursePreview() {
  const course = courses.find(c => String(c.course_id) === $("registerCourseSelect").value);
  $("registerCoursePreview").innerHTML = course
    ? `<span class="preview-course-icon">▤</span><div><strong>${escapeHtml(course.course_code)} · ${escapeHtml(course.course_name)}</strong><small>${escapeHtml(course.department)} · Semester ${escapeHtml(course.semester)} · ${escapeHtml(course.credits)} credits</small></div>`
    : '<span class="preview-course-icon">▤</span><div><strong>Your selected course</strong><small>Course details will appear here</small></div>';
}
function renderAdminCourses() {
  const query = ($("adminSearch")?.value || "").toLowerCase().trim();
  const filtered = courses.filter(c => `${c.course_code} ${c.course_name} ${c.department}`.toLowerCase().includes(query));
  $("adminCoursesBody").innerHTML = filtered.map(c => `<tr>
    <td class="course-cell"><strong>${escapeHtml(c.course_code)} · ${escapeHtml(c.course_name)}</strong><small>Course ID: ${c.course_id}</small></td>
    <td>${escapeHtml(c.department)}</td><td>Semester ${escapeHtml(c.semester)}</td><td>${escapeHtml(c.credits)} credits</td>
    <td><button class="action-btn action-edit" data-edit="${c.course_id}">Edit</button><button class="action-btn action-delete" data-delete="${c.course_id}">Delete</button></td>
  </tr>`).join("") || '<tr><td colspan="5" class="empty-cell">No courses found.</td></tr>';
  document.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => startEdit(Number(button.dataset.edit))));
  document.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => deleteCourse(Number(button.dataset.delete))));
}
async function loadRegistrations() {
  try {
    registrations = await api("/api/registrations");
    $("recordsSubtitle").textContent = $("recordsStudentFilter").value ? "Registrations for the selected student" : "All recorded course registrations";
    renderRegistrations();
    $("statRegistrations").textContent = registrations.length;
    $("statStudents").textContent = new Set(registrations.map(r => r.student_id)).size;
  } catch (error) { notify(error.message, true); }
}
function renderRegistrations() {
  const selected = $("recordsStudentFilter").value;
  const rows = registrations.filter(r => !selected || String(r.student_id) === selected);
  $("recordsCount").textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;
  $("recordsBody").innerHTML = rows.map(r => `<tr>
    <td class="student-cell"><strong>${escapeHtml(r.student_name)}</strong><small>${escapeHtml(r.roll_no)} · ${escapeHtml(r.branch)}</small></td>
    <td class="course-cell"><strong>${escapeHtml(r.course_code)} · ${escapeHtml(r.course_name)}</strong><small>${escapeHtml(r.department)}</small></td>
    <td>Semester ${escapeHtml(r.semester)}</td><td>${escapeHtml(formatDate(r.registration_date))}</td>
    <td><span class="status-pill">${escapeHtml(r.status)}</span></td>
  </tr>`).join("") || '<tr><td colspan="5" class="empty-cell">No registrations found for this selection.</td></tr>';
}
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0,10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
async function refreshData() {
  try {
    [courses, students, registrations] = await Promise.all([
      api("/api/courses"), api("/api/students"), api("/api/registrations")
    ]);
    populateDepartments();
    populateStudents();
    populateRegistrationCourses();
    renderCourses();
    renderRegistrations();
  } catch (error) {
    notify(`${error.message} Make sure MySQL is running and database.sql has been imported.`, true);
  }
}

$("courseSearch").addEventListener("input", filterCatalog);
$("semesterFilter").addEventListener("change", filterCatalog);
$("departmentFilter").addEventListener("change", filterCatalog);
$("adminSearch").addEventListener("input", renderAdminCourses);
$("studentSelect").addEventListener("change", updateStudentPreview);
$("registerCourseSelect").addEventListener("change", updateCoursePreview);
$("recordsStudentFilter").addEventListener("change", renderRegistrations);
$("refreshRecords").addEventListener("click", loadRegistrations);

$("registrationForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const result = await api("/api/registrations", {
      method: "POST",
      body: JSON.stringify({ student_id: $("studentSelect").value, course_id: $("registerCourseSelect").value })
    });
    notify(result.message);
    $("registrationForm").reset();
    updateStudentPreview();
    updateCoursePreview();
    await loadRegistrations();
    $("statRegistrations").textContent = registrations.length;
    $("statStudents").textContent = new Set(registrations.map(r => r.student_id)).size;
  } catch (error) { notify(error.message, true); }
});

$("courseForm").addEventListener("submit", async event => {
  event.preventDefault();
  const id = $("editCourseId").value;
  const payload = {
    course_code: $("courseCode").value.trim(),
    course_name: $("courseName").value.trim(),
    credits: Number($("courseCredits").value),
    department: $("courseDepartment").value,
    semester: Number($("courseSemester").value)
  };
  try {
    const result = await api(id ? `/api/courses/${id}` : "/api/courses", {
      method: id ? "PUT" : "POST", body: JSON.stringify(payload)
    });
    notify(result.message);
    resetCourseForm();
    await refreshData();
  } catch (error) { notify(error.message, true); }
});
function startEdit(id) {
  const course = courses.find(c => c.course_id === id);
  if (!course) return;
  $("editCourseId").value = course.course_id;
  $("courseCode").value = course.course_code;
  $("courseName").value = course.course_name;
  $("courseCredits").value = course.credits;
  $("courseDepartment").value = course.department;
  $("courseSemester").value = course.semester;
  $("adminFormTitle").textContent = "Edit course details";
  $("saveCourseBtn").innerHTML = "Save changes ↗";
  $("cancelEditBtn").classList.remove("hidden");
  $("courseForm").scrollIntoView({ behavior: "smooth", block: "center" });
}
function resetCourseForm() {
  $("courseForm").reset();
  $("editCourseId").value = "";
  $("adminFormTitle").textContent = "Add a new course";
  $("saveCourseBtn").innerHTML = "＋ Add course";
  $("cancelEditBtn").classList.add("hidden");
}
$("cancelEditBtn").addEventListener("click", resetCourseForm);
async function deleteCourse(id) {
  const course = courses.find(c => c.course_id === id);
  if (!course) return;
  if (!confirm(`Delete ${course.course_code} — ${course.course_name}?\nRegistrations for this course will also be deleted.`)) return;
  try {
    const result = await api(`/api/courses/${id}`, { method: "DELETE" });
    notify(result.message);
    await refreshData();
  } catch (error) { notify(error.message, true); }
}

refreshData();
