import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CATEGORIES } from '../lib/helpers'
import JobCard from '../components/JobCard'
import './PostJob.css'

export default function PostJob() {
  const { currentUser, isEmployer } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetTalentId = searchParams.get('talent')

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    if (!isEmployer) {
      navigate('/post-service')
    }
  }, [isEmployer, navigate])

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      if (skills.length >= 20) return
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()])
      }
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleSubmit = async (e, status = 'open') => {
    e.preventDefault()
    if (description.length < 100) {
      alert('Description must be at least 100 characters.')
      return
    }
    if (parseFloat(minBudget) > parseFloat(maxBudget)) {
      alert('Minimum budget cannot be greater than maximum budget.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.from('jobs').insert({
        employer_id: currentUser.id,
        title,
        category,
        description,
        skills,
        min_budget: parseFloat(minBudget),
        max_budget: parseFloat(maxBudget),
        deadline,
        status,
        target_talent_id: targetTalentId
      }).select().single()

      if (error) throw error
      
      alert(status === 'draft' ? 'Job saved as draft!' : 'Job published successfully!')
      navigate(`/jobs/${data.id}`)
    } catch (error) {
      console.error('Error posting job:', error)
      alert('Failed to post job.')
    } finally {
      setLoading(false)
    }
  }

  // Preview data object
  const previewJob = {
    title: title || 'Job Title Preview',
    description: description || 'Description will appear here...',
    category: category || 'Category',
    skills: skills,
    min_budget: minBudget || 0,
    max_budget: maxBudget || 0,
    deadline: deadline || new Date().toISOString(),
    created_at: new Date().toISOString(),
    proposals_count: 0,
    employer: {
      full_name: currentUser?.full_name,
      avatar_url: currentUser?.avatar_url
    }
  }

  return (
    <div className="post-job-page">
      <div className="post-job-container">
        <div className="post-job-form-side">
          <header className="form-header">
            <h1>Post a New Job</h1>
            <p>Find the perfect talent for your project</p>
          </header>

          <form className="job-form">
            <div className="form-group">
              <label>Job Title</label>
              <input
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Build a React website"
                required
              />
              <div className="input-info">{title.length}/100</div>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.slug} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description (min 100, max 5000 characters)</label>
              <textarea
                minLength={100}
                maxLength={5000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project in detail..."
                required
              />
              <div className="input-info">{description.length}/5000</div>
            </div>

            <div className="form-group">
              <label>Required Skills (Press Enter to add)</label>
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="e.g. React, UI Design, Node.js"
              />
              <div className="skills-pills">
                {skills.map((skill, index) => (
                  <span key={index} className="skill-pill">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>&times;</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Budget ($)</label>
                <input
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Budget ($)</label>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Project Deadline</label>
              <input
                type="date"
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'open')} 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Publishing...' : 'Publish Job'}
              </button>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'draft')} 
                className="btn-outline"
                disabled={loading}
              >
                Save as Draft
              </button>
            </div>
          </form>
        </div>

        <div className="post-job-preview-side">
          <div className="sticky-preview">
            <h3>Live Preview</h3>
            <p className="text-secondary mb-4">This is how your job will look in the marketplace.</p>
            <JobCard job={previewJob} />
          </div>
        </div>
      </div>
    </div>
  )
}
