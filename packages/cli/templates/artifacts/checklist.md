# Checklist: <タイトル>

## Delta Spec Coverage
- [ ] ADDED Requirement <Name> が design.md でカバーされている
- [ ] ADDED Requirement <Name> の Scenario が tasks.md の E2E に展開されている
- [ ] MODIFIED Requirement <Name> の旧挙動が壊れていない (回帰テスト)

## Source-of-Truth Regression
- [ ] `specs/<capability>/spec.md` の他 Requirement にデグレが無いか
- [ ] 関連 capability `specs/<other>/spec.md` の Scenario が壊れない確認をした

## Constitution
- [ ] 全 Principle に対する Constitution Check が design.md にある
