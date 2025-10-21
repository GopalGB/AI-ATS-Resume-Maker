// utils/pdfGenerator.ts
import { jsPDF } from 'jspdf';
import { StructuredResume } from '../types';

export const generatePdf = (resume: StructuredResume, outputType: 'download' | 'dataurl' | 'blob' = 'download'): string | Blob | void => {
    const doc = new jsPDF({
        unit: 'pt',
        format: 'a4'
    });
    
    // --- Document & Layout Constants ---
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
    const MARGIN = 35;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
    const TOP_MARGIN = MARGIN;
    const BOTTOM_MARGIN = MARGIN;

    // --- Colors, Fonts, & Spacing (Recalibrated for a more spacious feel) ---
    const PRIMARY_COLOR = '#2d6cdf';
    const TEXT_COLOR = '#333333';
    const LIGHT_TEXT_COLOR = '#666666';
    const FONT_SIZE_NORMAL = 7.8;
    const FONT_SIZE_LARGE = 8.5;
    const FONT_SIZE_SMALL = 7.2;
    const BASE_LINE_HEIGHT = 1.45; 
    const MIN_SECTION_SPACING = 12; // Increased base spacing for readability

    let cursorY = TOP_MARGIN;

    // --- Helper function for two-column rows ---
    const getTwoColumnRowHeight = (leftText: string, rightText: string, leftOptions: any) => {
        doc.setFontSize(leftOptions.fontSize || FONT_SIZE_NORMAL);
        const rightTextWidth = doc.getTextWidth(rightText);
        const maxLeftWidth = CONTENT_WIDTH - rightTextWidth - 10;
        const leftLines = doc.splitTextToSize(leftText, maxLeftWidth);
        return leftLines.length * (leftOptions.fontSize || FONT_SIZE_NORMAL) * BASE_LINE_HEIGHT;
    };

    const renderTwoColumnRow = (leftText: string, rightText: string, leftOptions: any, rightOptions: any) => {
        doc.setFont(leftOptions.fontFamily || 'helvetica', leftOptions.fontStyle || 'normal');
        doc.setFontSize(leftOptions.fontSize || FONT_SIZE_NORMAL);
        doc.setTextColor(leftOptions.color || TEXT_COLOR);
        const rightTextWidth = doc.getTextWidth(rightText);
        const maxLeftWidth = CONTENT_WIDTH - rightTextWidth - 10;
        
        const leftLines = doc.splitTextToSize(leftText, maxLeftWidth);
        doc.text(leftLines, MARGIN, cursorY);

        doc.setFont(rightOptions.fontFamily || 'helvetica', rightOptions.fontStyle || 'normal');
        doc.setFontSize(rightOptions.fontSize || FONT_SIZE_NORMAL);
        doc.setTextColor(rightOptions.color || TEXT_COLOR);
        doc.text(rightText, PAGE_WIDTH - MARGIN, cursorY, { align: 'right' });

        cursorY += leftLines.length * (leftOptions.fontSize || FONT_SIZE_NORMAL) * BASE_LINE_HEIGHT;
    };

    // --- UNIFIED SECTION CALCULATORS & RENDERERS ---

    const calculateAndRenderHeader = (dryRun: boolean) => {
        let height = 0;
        
        // Name
        height += 16;
        
        // Contact info
        doc.setFontSize(FONT_SIZE_SMALL);
        const contactParts = [resume.contact.email, resume.contact.phone, resume.contact.linkedin, resume.contact.github].filter(Boolean);
        const fullContactString = contactParts.join(' • ');
        const contactLines = doc.splitTextToSize(fullContactString, CONTENT_WIDTH);
        height += contactLines.length * FONT_SIZE_SMALL * BASE_LINE_HEIGHT;
        
        if (!dryRun) {
            cursorY = TOP_MARGIN;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(17);
            doc.setTextColor(PRIMARY_COLOR);
            doc.text(resume.name, PAGE_WIDTH / 2, cursorY, { align: 'center' });
            cursorY += 16;

            const contactRenderParts: { text: string; link?: string }[] = [];
            if (resume.contact.email) contactRenderParts.push({ text: resume.contact.email, link: `mailto:${resume.contact.email}` });
            if (resume.contact.phone) contactRenderParts.push({ text: resume.contact.phone });
            if (resume.contact.linkedin) {
                const url = resume.contact.linkedin.startsWith('http') ? resume.contact.linkedin : `https://${resume.contact.linkedin}`;
                contactRenderParts.push({ text: resume.contact.linkedin.replace(/^(https?:\/\/)?(www\.)?/, ''), link: url });
            }
            if (resume.contact.github) {
                const url = resume.contact.github.startsWith('http') ? resume.contact.github : `https://${resume.contact.github}`;
                contactRenderParts.push({ text: resume.contact.github.replace(/^(https?:\/\/)?(www\.)?/, ''), link: url });
            }
            
            doc.setFontSize(FONT_SIZE_SMALL);
            const separator = ' • ';
            const fullContactStringForRender = contactRenderParts.map(p => p.text).join(separator);
            const totalWidth = doc.getTextWidth(fullContactStringForRender);
            let startX = (PAGE_WIDTH - totalWidth) / 2;
            
            contactRenderParts.forEach((part, index) => {
                const textWidth = doc.getTextWidth(part.text);
                if (part.link) {
                    doc.setTextColor(PRIMARY_COLOR);
                    doc.textWithLink(part.text, startX, cursorY, { url: part.link });
                } else {
                    doc.setTextColor(LIGHT_TEXT_COLOR);
                    doc.text(part.text, startX, cursorY);
                }
                startX += textWidth;
                if (index < contactRenderParts.length - 1) {
                    doc.setTextColor(LIGHT_TEXT_COLOR);
                    doc.text(separator, startX, cursorY);
                    startX += doc.getTextWidth(separator);
                }
            });
            cursorY += contactLines.length * FONT_SIZE_SMALL * BASE_LINE_HEIGHT;
        }
        return height;
    };

    const getSectionHeaderHeight = () => 10 + 3 + 12; // fontSize + space_before_line + space_after_line

    const renderSectionHeader = (title: string) => {
        const headerFontSize = 10;
        doc.setFontSize(headerFontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PRIMARY_COLOR);
        doc.text(title, MARGIN, cursorY);

        // Move cursor down past the text height
        cursorY += headerFontSize; 
        
        // Add space between text and line
        cursorY += 3;
        
        // Draw line
        doc.setDrawColor(PRIMARY_COLOR);
        doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
        
        // Add increased space after line (user request)
        cursorY += 12;
    };
    
    const calculateAndRenderGenericSection = (title: string, contentRenderer: (dryRun: boolean) => number) => (dryRun: boolean) => {
        let height = getSectionHeaderHeight();
        height += contentRenderer(true); // Calculate content height
        if (!dryRun) {
            renderSectionHeader(title);
            contentRenderer(false); // Render content
        }
        return height;
    };
    
    const summaryContent = (dryRun: boolean) => {
        doc.setFontSize(FONT_SIZE_NORMAL);
        const summaryLines = doc.splitTextToSize(resume.summary, CONTENT_WIDTH);
        const height = summaryLines.length * FONT_SIZE_NORMAL * BASE_LINE_HEIGHT;
        if (!dryRun) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(TEXT_COLOR);
            doc.text(summaryLines, MARGIN, cursorY);
            cursorY += height;
        }
        return height;
    };
    
    const skillsContent = (dryRun: boolean) => {
        let height = 0;
        doc.setFontSize(FONT_SIZE_NORMAL);
        resume.skills.forEach(skillCat => {
            const categoryText = `${skillCat.category}: `;
            const itemsText = skillCat.items.join(', ');
            doc.setFont('helvetica', 'bold');
            const categoryWidth = doc.getTextWidth(categoryText);
            doc.setFont('helvetica', 'normal');
            const remainingWidth = CONTENT_WIDTH - categoryWidth;
            const itemLines = doc.splitTextToSize(itemsText, remainingWidth);
            height += itemLines.length * FONT_SIZE_NORMAL * BASE_LINE_HEIGHT;
        });
        height += 2; // bottom padding
        if (!dryRun) {
            resume.skills.forEach(skillCat => {
                const categoryText = `${skillCat.category}: `;
                const itemsText = skillCat.items.join(', ');
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(TEXT_COLOR);
                const categoryWidth = doc.getTextWidth(categoryText);
                doc.setFont('helvetica', 'normal');
                const remainingWidth = CONTENT_WIDTH - categoryWidth;
                const itemLines = doc.splitTextToSize(itemsText, remainingWidth);
                doc.setFont('helvetica', 'bold');
                doc.text(categoryText, MARGIN, cursorY);
                doc.setFont('helvetica', 'normal');
                doc.text(itemLines, MARGIN + categoryWidth, cursorY);
                cursorY += itemLines.length * FONT_SIZE_NORMAL * BASE_LINE_HEIGHT;
            });
            cursorY += 2;
        }
        return height;
    };
    
    const experienceContent = (dryRun: boolean) => {
        let height = 0;
        resume.experience.forEach((exp, index) => {
            if (index > 0) height += MIN_SECTION_SPACING;
            height += getTwoColumnRowHeight(exp.job_title, '', { fontSize: FONT_SIZE_LARGE });
            height += FONT_SIZE_NORMAL * BASE_LINE_HEIGHT + 3; // +3 for padding
            exp.responsibilities.forEach(resp => {
                const bulletedResp = `•  ${resp}`;
                const respLines = doc.splitTextToSize(bulletedResp, CONTENT_WIDTH - 10);
                height += respLines.length * FONT_SIZE_NORMAL * BASE_LINE_HEIGHT;
            });
        });
        if (!dryRun) {
            resume.experience.forEach((exp, index) => {
                if (index > 0) cursorY += MIN_SECTION_SPACING;
                renderTwoColumnRow(exp.job_title, `${exp.start_date} - ${exp.end_date}`, { fontSize: FONT_SIZE_LARGE, fontStyle: 'bold' }, { fontSize: FONT_SIZE_SMALL, color: LIGHT_TEXT_COLOR });
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(FONT_SIZE_NORMAL);
                doc.setTextColor(TEXT_COLOR);
                doc.text(`${exp.company}, ${exp.location}`, MARGIN, cursorY);
                cursorY += FONT_SIZE_NORMAL * BASE_LINE_HEIGHT + 3;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(FONT_SIZE_NORMAL);
                doc.setTextColor(TEXT_COLOR);
                exp.responsibilities.forEach(resp => {
                    const bulletedResp = `•  ${resp}`;
                    const respLines = doc.splitTextToSize(bulletedResp, CONTENT_WIDTH - 10);
                    doc.text(respLines, MARGIN + 10, cursorY);
                    cursorY += respLines.length * FONT_SIZE_NORMAL * BASE_LINE_HEIGHT;
                });
            });
        }
        return height;
    };
    
    const projectsContent = (dryRun: boolean) => {
        if (!resume.projects || resume.projects.length === 0) return 0;
        let height = 0;
        resume.projects.forEach((proj, index) => {
            if (index > 0) height += MIN_SECTION_SPACING;
            height += FONT_SIZE_LARGE * BASE_LINE_HEIGHT + 3; // +3 for padding
            proj.description.forEach(desc => {
                const bulletedDesc = `•  ${desc}`;
                const descLines = doc.splitTextToSize(bulletedDesc, CONTENT_WIDTH - 10);
                height += descLines.length * FONT_SIZE_NORMAL * BASE_LINE_HEIGHT;
            });
            if (proj.technologies) {
                height += 1;
                const techText = `Technologies: ${proj.technologies}`;
                const techLines = doc.splitTextToSize(techText, CONTENT_WIDTH - 10);
                height += techLines.length * FONT_SIZE_SMALL * BASE_LINE_HEIGHT;
            }
        });
        if (!dryRun) {
            resume.projects.forEach((proj, index) => {
                if (index > 0) cursorY += MIN_SECTION_SPACING;
                doc.setFontSize(FONT_SIZE_LARGE);
                doc.setFont('helvetica', 'bold');
                if (proj.link) {
                    doc.setTextColor(PRIMARY_COLOR);
                    doc.textWithLink(proj.name, MARGIN, cursorY, { url: proj.link });
                    const textWidth = doc.getTextWidth(proj.name);
                    doc.setDrawColor(PRIMARY_COLOR);
                    doc.line(MARGIN, cursorY + 1, MARGIN + textWidth, cursorY + 1);
                } else {
                    doc.setTextColor(TEXT_COLOR);
                    doc.text(proj.name, MARGIN, cursorY);
                }
                cursorY += FONT_SIZE_LARGE * BASE_LINE_HEIGHT + 3;
                doc.setTextColor(TEXT_COLOR); // FIX: Reset color for descriptions
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(FONT_SIZE_NORMAL);
                proj.description.forEach(desc => {
                    const bulletedDesc = `•  ${desc}`;
                    const descLines = doc.splitTextToSize(bulletedDesc, CONTENT_WIDTH - 10);
                    doc.text(descLines, MARGIN + 10, cursorY);
                    cursorY += descLines.length * FONT_SIZE_NORMAL * BASE_LINE_HEIGHT;
                });
                if (proj.technologies) {
                    cursorY += 1;
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(LIGHT_TEXT_COLOR);
                    doc.setFontSize(FONT_SIZE_SMALL);
                    const techText = `Technologies: ${proj.technologies}`;
                    const techLines = doc.splitTextToSize(techText, CONTENT_WIDTH - 10);
                    doc.text(techLines, MARGIN + 10, cursorY);
                    cursorY += techLines.length * FONT_SIZE_SMALL * BASE_LINE_HEIGHT;
                }
            });
        }
        return height;
    };
    
    const educationContent = (dryRun: boolean) => {
        let height = 0;
        resume.education.forEach((edu, index) => {
            if (index > 0) height += MIN_SECTION_SPACING;
            height += getTwoColumnRowHeight(edu.degree, edu.graduation_date, { fontSize: FONT_SIZE_LARGE });
            height += getTwoColumnRowHeight(edu.university, '', { fontSize: FONT_SIZE_NORMAL });
        });
        if (!dryRun) {
            resume.education.forEach((edu, index) => {
                if (index > 0) cursorY += MIN_SECTION_SPACING;
                renderTwoColumnRow(edu.degree, edu.graduation_date, { fontSize: FONT_SIZE_LARGE, fontStyle: 'bold' }, { fontSize: FONT_SIZE_SMALL, color: LIGHT_TEXT_COLOR });
                renderTwoColumnRow(edu.university, '', { fontSize: FONT_SIZE_NORMAL }, {});
            });
        }
        return height;
    };
    
    const allSections = [
        calculateAndRenderHeader,
        calculateAndRenderGenericSection('PROFESSIONAL SUMMARY', summaryContent),
        calculateAndRenderGenericSection('TECHNICAL SKILLS', skillsContent),
        calculateAndRenderGenericSection('PROFESSIONAL EXPERIENCE', experienceContent),
        calculateAndRenderGenericSection('KEY PROJECTS', projectsContent),
        calculateAndRenderGenericSection('EDUCATION', educationContent),
    ];
    
    // --- PASS 1: Calculate total content height with MINIMUM spacing ---
    let totalMinimumHeight = 0;
    const sectionsToRender = allSections.filter(sec => sec(true) > 0);
    sectionsToRender.forEach((sectionFunc, index) => {
        totalMinimumHeight += sectionFunc(true); // Dry run
        if (index < sectionsToRender.length - 1) {
            totalMinimumHeight += MIN_SECTION_SPACING;
        }
    });

    // --- DYNAMIC SPACING CALCULATION ---
    const renderablePageHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
    const extraSpace = renderablePageHeight - totalMinimumHeight;
    const numGaps = sectionsToRender.length > 1 ? sectionsToRender.length - 1 : 1;
    let bonusSpacing = extraSpace > 0 ? extraSpace / numGaps : 0;
    
    // --- PASS 2: Render with dynamic spacing ---
    cursorY = TOP_MARGIN;
    sectionsToRender.forEach((sectionFunc, index) => {
        sectionFunc(false); // Real render
        if (index < sectionsToRender.length - 1) {
            cursorY += MIN_SECTION_SPACING + bonusSpacing;
        }
    });

    if (outputType === 'download') {
        doc.save('Tailored-Resume.pdf');
        return;
    }

    if (outputType === 'dataurl') {
        return doc.output('datauristring');
    }
    
    if (outputType === 'blob') {
        return doc.output('blob');
    }
};