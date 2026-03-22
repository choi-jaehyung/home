@AGENTS.md

# 배포 작업 지침

## Git Push 규칙

- **`git push --force`는 절대 사용 금지**
- Phase 7 MD 업로더로 업로드된 파일들은 로컬에 존재하지 않고 GitHub에만 커밋됨
- `git push --force` 사용 시 해당 파일들이 모두 삭제될 위험이 있음
- 배포 전 반드시 `git pull` 을 먼저 실행하여 원격 변경사항을 로컬에 병합할 것
- 충돌이 발생한 경우 `--force` 로 해결하지 말고 수동으로 병합 후 push할 것
