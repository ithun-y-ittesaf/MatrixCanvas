# Software Design Report

`report.tex` is a self-contained LaTeX report covering:

1. Title page (fill in `[University / Institution Name]`, `[Course Code -- Course Title]`, `[Instructor Name]`)
2. Introduction & tech stack
3. Object-oriented design overview
4. Class diagram (TikZ) + explanation — `Matrix2x2`, `AppStore`, `CustomVector`, `Preset`
5. Three-layer software architecture diagram (TikZ) + explanation
6. Conclusion
7. Appendix A: placeholder for your SRS

## Rendering in Overleaf

1. Upload `report.tex` as a new Overleaf project (or paste its contents into a blank project).
2. All diagrams are drawn with TikZ — no extra image files needed.
3. To append your existing SRS: export it to PDF, name it `srs.pdf`, upload it into the
   same Overleaf project folder, then uncomment the `\includepdf[...]{srs.pdf}` line
   near the bottom of `report.tex`.
4. Compile with pdfLaTeX (Overleaf's default).
