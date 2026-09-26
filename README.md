# Plan My Educator Cover Letter

Standalone College of Education quick tool.

## Files
- `index.html`
- `styles.css`
- `script.js`

Upload all three files to the same repository/folder.

## Previous-research connection
The tool checks browser `localStorage` for earlier activity data. It currently looks for these keys:

### School research
- `uiowaCoeSchoolResearch`
- `coeSchoolResearch`
- `educatorSchoolResearch`

### Experiences
- `uiowaCoeExperiences`
- `coeExperiences`
- `educatorExperiences`

### Skills
- `uiowaCoeSkills`
- `coeSkills`
- `educatorSkills`

### Tailoring/job-posting work
- `uiowaCoeTailoring`
- `coeTailoring`
- `educatorTailoring`

### This tool saves
- `uiowaCoeCoverLetterPlan`

If your existing tools use different keys, update `STORAGE_KEYS` at the top of `script.js`.

## Important cross-repository note
Browser `localStorage` is shared only when tools are served from the same origin/domain. Separate GitHub repositories are fine if they are ultimately embedded/served through the same origin and storage context. If they run on different GitHub Pages domains/origins, direct localStorage sharing will not work; use your shared Supabase/data layer instead.

## Data shapes
The adapter is intentionally forgiving. It will try to read arrays such as `experiences`, `items`, or `findings`, and common fields such as `title`, `role`, `school`, `organization`, `description`, `notes`, and `why`.

For the cleanest connection across tools, standardize shared records around stable IDs:

```json
{
  "experiences": [
    {
      "id": "exp_123",
      "title": "Student Teaching",
      "school": "Grant Elementary",
      "tasks": ["Adjusted small-group reading instruction using formative data"]
    }
  ]
}
```

and school research:

```json
{
  "findings": [
    {
      "id": "research_123",
      "category": "Program or initiative",
      "text": "Schoolwide PBIS",
      "why": "I value proactive, consistent approaches to student support"
    }
  ]
}
```

## ICON embedding
If this is hosted externally, embed the hosted page in ICON using the same approach as your other GitHub-hosted tools. The UI is responsive and has no fixed-width layout.
