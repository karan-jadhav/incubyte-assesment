# Overall
1. always read the docs/ before making changes and incrementally update them in backend/ for backend changes as you make changes to the codebase. files should not be too long and not too short, they should be concise and to the point and split into multiple files accordingly.

# Backend
1. always use uv add to add dependencies to the project, never manually add them to pyproject.toml. 
2. always use uv run to run the project, never manually run the python files.
3. follow TDD approach whenever new features are being added to the backend write tests first and then implement the feature.

# Frontend
1. always use npm install to add dependencies to the project, never manually add them to package.json.