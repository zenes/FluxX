#!/bin/bash

# progress.md 업데이트 및 git commit/push 자동화 스크립트

MESSAGE=$1
if [ -z "$MESSAGE" ]; then
  MESSAGE="Update progress and commit changes"
fi

# 1. Git Add
git add .

# 2. Commit
git commit -m "$MESSAGE"

# 3. Push
git push origin $(git rev-parse --abbrev-ref HEAD)
