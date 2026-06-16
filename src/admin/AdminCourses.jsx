import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { uploadFile } from '../lib/cloudinary'
import { formatCurrency, safeNumber } from '../lib/helpers'
import './AdminCourses.css'

const PLATFORMS = ['Udemy', 'Coursera', 'Other']
const CATEGORIES = [
  'Web Development', 'Mobile Apps', 'Graphic Design', 'Digital Marketing',
  'UI/UX Design', 'Data Science', 'Programming', 'Business', 'Language Learning'
]
const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced']

const initialForm = {
  title: '',
  platform: 'Udemy',
  category: 'Web Development',
  affiliate_url: '',
  cover_image_url: '',
  description: '',
  instructor_name: '',
  current_price: 0,
  original_price: 0,
  rating: 0,
  students_count: '0',
  duration: '',
  level: 'All Levels',
  is_featured: false,
  is_active: true,
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [coverTab, setCoverTab] = useState('upload')
  const [uploadFileState, setUploadFileState] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Admin courses load:', error)
        return
      }
      setCourses(data || [])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditCourse(null)
    setForm(initialForm)
    setCoverTab('upload')
    setUploadFileState(null)
    setError('')
  }

  const openModal = (course = null) => {
    if (course) {
      setEditCourse(course)
      setForm({
        title: course.title || '',
        platform: course.platform || 'Udemy',
        category: course.category || 'Web Development',
        affiliate_url: course.affiliate_url || '',
        cover_image_url: course.cover_image_url || '',
        description: course.description || '',
        instructor_name: course.instructor_name || '',
        current_price: safeNumber(course.current_price),
        original_price: safeNumber(course.original_price),
        rating: safeNumber(course.rating),
        students_count: course.students_count || '0',
        duration: course.duration || '',
        level: course.level || 'All Levels',
        is_featured: course.is_featured || false,
        is_active: course.is_active !== false,
      })
      setCoverTab('upload')
      setUploadFileState(null)
    } else {
      resetForm()
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    resetForm()
    setModalOpen(false)
  }

  const saveCourse = async () => {
    const isFree = safeNumber(form.current_price) === 0
    if (!form.title.trim() || !form.platform || !form.category || (!isFree && !form.affiliate_url.trim())) {
      setError(isFree
        ? 'Title, platform and category are required. Free courses can be published without an affiliate link.'
        : 'Title, platform, category and affiliate link are required for paid courses.')
      return
    }

    setSaving(true)
    setError('')
    try {
      let coverUrl = form.cover_image_url

      if (coverTab === 'upload' && uploadFileState) {
        const result = await uploadFile(uploadFileState, 'courses')
        coverUrl = result.url
      }

      const payload = {
        title: form.title.trim(),
        platform: form.platform,
        category: form.category,
        affiliate_url: form.affiliate_url.trim(),
        cover_image_url: coverUrl,
        description: form.description,
        instructor_name: form.instructor_name,
        current_price: Number(form.current_price) || 0,
        original_price: Number(form.original_price) || 0,
        rating: Number(form.rating) || 0,
        students_count: form.students_count.trim() || '0',
        duration: form.duration,
        level: form.level,
        is_featured: form.is_featured,
        is_active: form.is_active,
      }

      if (editCourse) {
        const { error } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', editCourse.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([payload])
        if (error) throw error
      }

      await loadCourses()
      closeModal()
    } catch (err) {
      console.error('Save course error:', err)
      setError(err.message || 'Unable to save course')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete "${course.title}"?`)) return
    await supabase.from('courses').delete().eq('id', course.id)
    await loadCourses()
  }

  const toggleField = async (course, field) => {
    await supabase.from('courses').update({ [field]: !course[field] }).eq('id', course.id)
    await loadCourses()
  }

  const stats = {
    total: courses.length,
    active: courses.filter((course) => course.is_active).length,
    featured: courses.filter((course) => course.is_featured).length,
    categories: new Set(courses.map((course) => course.category || '')).size,
  }

  return (
    <div className="admin-courses-page">
      <div className="admin-courses-header">
        <div>
          <h2>Course Library</h2>
          <p>Manage affiliate courses, featured picks, and publishing settings.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => openModal()}>
          Add New Course
        </button>
      </div>

      <div className="admin-courses-stats">
        <div className="stat-card">
          <span className="stat-label">Total Courses</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Courses</span>
          <span className="stat-value">{stats.active}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Featured Courses</span>
          <span className="stat-value">{stats.featured}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Categories</span>
          <span className="stat-value">{stats.categories}</span>
        </div>
      </div>

      <div className="admin-courses-table-wrap">
        <table className="admin-courses-table">
          <thead>
            <tr>
              <th>Cover</th>
              <th>Title</th>
              <th>Platform</th>
              <th>Category</th>
              <th>Price</th>
              <th>Featured</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading-row">Loading courses...</td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row">No courses available yet.</td>
              </tr>
            ) : courses.map((course) => (
              <tr key={course.id}>
                <td>
                  {course.cover_image_url ? (
                    <img src={course.cover_image_url} alt={course.title} className="course-thumb" />
                  ) : (
                    <div className="course-thumb-placeholder">No image</div>
                  )}
                </td>
                <td>
                  <div className="course-title-cell">{course.title}</div>
                  <div className="course-meta-small">{course.instructor_name || 'Instructor'}</div>
                </td>
                <td>
                  <span className={`platform-badge platform-${course.platform?.toLowerCase()}`}>
                    {course.platform || 'Other'}
                  </span>
                </td>
                <td>{course.category}</td>
                <td className="course-price-cell">
                  {safeNumber(course.current_price) === 0 ? (
                    <span className="course-price-current">Free</span>
                  ) : (
                    <>
                      <span className="course-price-current">{formatCurrency(safeNumber(course.current_price))}</span>
                      {safeNumber(course.original_price) > safeNumber(course.current_price) && (
                        <span className="course-price-original">{formatCurrency(safeNumber(course.original_price))}</span>
                      )}
                    </>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className={`toggle-btn ${course.is_featured ? 'active' : ''}`}
                    onClick={() => toggleField(course, 'is_featured')}
                  >
                    {course.is_featured ? 'Yes' : 'No'}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={`toggle-btn ${course.is_active ? 'active' : ''}`}
                    onClick={() => toggleField(course, 'is_active')}
                  >
                    {course.is_active ? 'Yes' : 'No'}
                  </button>
                </td>
                <td className="table-actions">
                  <button type="button" className="btn-secondary" onClick={() => openModal(course)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger" onClick={() => handleDelete(course)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <div>
                <h3>{editCourse ? 'Edit Course' : 'Add Course'}</h3>
                <p>{editCourse ? 'Update the affiliate course details.' : 'Create a new course listing for learners.'}</p>
              </div>
              <button type="button" className="close-modal" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-grid">
              <section className="modal-section">
                <h4>Basic Info</h4>
                <label>
                  Course Title
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Complete Web Development Bootcamp"
                  />
                </label>
                <label>
                  Platform
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  >
                    {PLATFORMS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
              </section>

              <section className="modal-section">
                <h4>Affiliate Link</h4>
                <label>
                  Affiliate Link
                  <input
                    value={form.affiliate_url}
                    onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })}
                    placeholder="Paste your affiliate URL here (optional for free courses)"
                  />
                </label>
              </section>

              <section className="modal-section">
                <h4>Course Details</h4>
                <label>
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief course description"
                  />
                </label>
                <label>
                  Instructor Name
                  <input
                    value={form.instructor_name}
                    onChange={(e) => setForm({ ...form, instructor_name: e.target.value })}
                    placeholder="Instructor Name"
                  />
                </label>
              </section>

              <section className="modal-section modal-media-section">
                <h4>Media</h4>
                <div className="media-tabs">
                  <button
                    type="button"
                    className={coverTab === 'upload' ? 'active' : ''}
                    onClick={() => setCoverTab('upload')}
                  >Upload</button>
                  <button
                    type="button"
                    className={coverTab === 'url' ? 'active' : ''}
                    onClick={() => setCoverTab('url')}
                  >Image URL</button>
                </div>
                {coverTab === 'upload' ? (
                  <label className="file-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUploadFileState(e.target.files?.[0] || null)}
                    />
                    <span>{uploadFileState ? uploadFileState.name : 'Choose a cover image'}</span>
                  </label>
                ) : (
                  <label>
                    Cover Image URL
                    <input
                      value={form.cover_image_url}
                      onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                      placeholder="Paste image URL directly"
                    />
                  </label>
                )}
              </section>

              <section className="modal-section">
                <h4>Pricing</h4>
                <label>
                  Current Price
                  <div className="price-row">
                    <span>$</span>
                    <input
                      type="number"
                      min="0"
                      value={form.current_price}
                      onChange={(e) => setForm({ ...form, current_price: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </label>
                <label>
                  Original Price
                  <div className="price-row">
                    <span>$</span>
                    <input
                      type="number"
                      min="0"
                      value={form.original_price}
                      onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </label>
              </section>

              <section className="modal-section">
                <h4>Stats</h4>
                <label>
                  Rating
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  />
                </label>
                <label>
                  Students Count
                  <input
                    value={form.students_count}
                    onChange={(e) => setForm({ ...form, students_count: e.target.value })}
                    placeholder="e.g. 125,000 students"
                  />
                </label>
                <label>
                  Duration
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 42 hours"
                  />
                </label>
                <label>
                  Level
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  >
                    {LEVELS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
              </section>

              <section className="modal-section modal-settings-section">
                <h4>Settings</h4>
                <label className="switch-field">
                  <span>Featured Course</span>
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  />
                </label>
                <label className="switch-field">
                  <span>Active</span>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                </label>
              </section>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn-primary" onClick={saveCourse} disabled={saving}>
                {saving ? 'Saving...' : editCourse ? 'Save Changes' : 'Save Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
