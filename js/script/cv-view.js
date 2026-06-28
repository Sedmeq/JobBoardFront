/**
 * CV View — namizədin profil məlumatlarını vahid CV strukturunda göstərir.
 * İstifadə:
 *   cv-view.html?id=<userId>   → işəgötürən/admin namizədin CV-sinə baxır
 *   cv-view.html?me=1          → namizəd öz CV-sinə baxır
 * "Download PDF" düyməsi brauzerin çap dialoqunu açır (Save as PDF).
 */
$(document).ready(function ()
{
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var isMe = params.get('me') === '1';

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function showError(msg)
    {
        $('#cvLoading').hide();
        $('#cvPaper').hide();
        $('#cvError').text(msg).show();
    }

    if (!isMe && !id)
    {
        showError('No candidate specified.');
        return;
    }

    if ((isMe || !id) && !localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var endpoint = isMe ? '/candidates/me' : '/candidates/' + encodeURIComponent(id);

    function fmtRange(start, end, isCurrent)
    {
        var s = start != null ? String(start) : '';
        var e = isCurrent ? 'Present' : (end != null && end !== '' ? String(end) : '');
        if (s && e) return s + ' — ' + e;
        return s || e || '';
    }

    function fmtDate(d)
    {
        if (!d) return '';
        var dt = new Date(d);
        if (isNaN(dt.getTime())) return String(d);
        return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }

    function render(p)
    {
        // Başlıq
        $('#cvName').text(p.fullName || 'Candidate');
        if (p.avatarUrl)
        {
            var a = p.avatarUrl + (p.avatarUrl.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
            $('#cvAvatar').attr('src', a).attr('onerror', "this.src='images/team/pic1.jpg'");
        }
        if (p.headline) $('#cvHeadline').text(p.headline).show();

        // Əlaqə / link sətri
        var contact = [];
        if (p.email) contact.push('<span>&#9993; ' + esc(p.email) + '</span>');
        if (p.location) contact.push('<span>&#128205; ' + esc(p.location) + '</span>');
        if (p.experienceYears != null) contact.push('<span>&#128188; ' + esc(p.experienceYears) + ' yrs exp.</span>');
        if (p.website) contact.push('<a href="' + esc(p.website) + '" target="_blank" rel="noopener">Website</a>');
        if (p.linkedInUrl) contact.push('<a href="' + esc(p.linkedInUrl) + '" target="_blank" rel="noopener">LinkedIn</a>');
        if (p.githubUrl) contact.push('<a href="' + esc(p.githubUrl) + '" target="_blank" rel="noopener">GitHub</a>');
        $('#cvContact').html(contact.join(''));

        // Xülasə
        if (p.summary)
        {
            $('#cvSummary').html(esc(p.summary).replace(/\n/g, '<br>'));
            $('#cvSummarySection').show();
        }

        // Bacarıqlar
        if (p.skills && p.skills.length)
        {
            $('#cvSkills').html(p.skills.map(function (s)
            {
                return '<span class="cv-skill">' + esc(s) + '</span>';
            }).join(''));
            $('#cvSkillsSection').show();
        }

        // İş təcrübəsi
        if (p.workExperiences && p.workExperiences.length)
        {
            $('#cvExp').html(p.workExperiences.map(function (w)
            {
                var date = fmtDate(w.startDate) + ' — ' + (w.isCurrent ? 'Present' : (fmtDate(w.endDate) || ''));
                return '<div class="cv-item">' +
                    '<div class="cv-item-head">' +
                    '<div><p class="cv-item-title">' + esc(w.position) + '</p>' +
                    '<p class="cv-item-sub">' + esc(w.company) + (w.location ? ' · ' + esc(w.location) : '') + '</p></div>' +
                    '<span class="cv-item-date">' + esc(date) + '</span>' +
                    '</div>' +
                    (w.description ? '<p class="cv-item-desc">' + esc(w.description).replace(/\n/g, '<br>') + '</p>' : '') +
                    '</div>';
            }).join(''));
            $('#cvExpSection').show();
        }

        // Təhsil
        if (p.educations && p.educations.length)
        {
            $('#cvEdu').html(p.educations.map(function (e)
            {
                var date = fmtRange(e.startYear, e.endYear, e.isCurrent);
                return '<div class="cv-item">' +
                    '<div class="cv-item-head">' +
                    '<div><p class="cv-item-title">' + esc(e.degree) + (e.field ? ', ' + esc(e.field) : '') + '</p>' +
                    '<p class="cv-item-sub">' + esc(e.school) + '</p></div>' +
                    '<span class="cv-item-date">' + esc(date) + '</span>' +
                    '</div>' +
                    (e.description ? '<p class="cv-item-desc">' + esc(e.description).replace(/\n/g, '<br>') + '</p>' : '') +
                    '</div>';
            }).join(''));
            $('#cvEduSection').show();
        }

        // Dillər
        if (p.languages && p.languages.length)
        {
            $('#cvLangs').html(p.languages.map(function (l)
            {
                return '<div class="cv-lang"><strong>' + esc(l.name) + '</strong> <span>(' + esc(l.level) + ')</span></div>';
            }).join(''));
            $('#cvLangSection').show();
        }

        $('#cvLoading').hide();
        $('#cvError').hide();
        $('#cvPaper').show();

        // Səhifə başlığını adla dəyiş (PDF fayl adı kimi istifadə olunur)
        if (p.fullName) document.title = 'CV - ' + p.fullName;
    }

    apiFetch(endpoint)
        .then(function (result)
        {
            if (!result || !result.success || !result.data)
            {
                showError('Could not load CV data.');
                return;
            }
            render(result.data);
        })
        .catch(function (err)
        {
            console.error('CV load error:', err);
            var msg = (err && err.data && err.data.error && err.data.error.message) || 'Could not load CV. The candidate profile may not exist.';
            showError(msg);
        });

    $('#cvDownloadBtn').on('click', function ()
    {
        window.print();
    });
});
