/**
 * My Resume (Candidate) — tam funksional CV qurucusu.
 * Backend:
 *   GET    /api/candidates/me
 *   PUT    /api/candidates/me          (headline, summary, skills[], languages[], + digər profil sahələri)
 *   POST   /api/candidates/me/experience      PUT/DELETE .../experience/{id}
 *   POST   /api/candidates/me/education        PUT/DELETE .../education/{id}
 *   POST   /api/candidates/me/resume (file)    DELETE .../resume
 *   POST   /api/candidates/me/avatar (file)
 * Download CV (PDF): cv-view.html?me=1
 */
$(document).ready(function ()
{
    if (!$('#resumeContent').length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var alertEl = $('#resumeAlert');
    var currentProfile = {};
    var skills = [];

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert alert-' + (type || 'info')).html(msg).slideDown(200);
        if (type === 'success') setTimeout(function () { alertEl.slideUp(200); }, 5000);
    }

    function dateOnly(v) { return v ? String(v).slice(0, 10) : ''; }

    function fmtMonth(d)
    {
        if (!d) return '';
        var dt = new Date(d);
        if (isNaN(dt.getTime())) return String(d);
        return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }

    // ─── Skills ──────────────────────────────────────────────
    function renderSkills()
    {
        var box = $('#rSkillsList');
        box.empty();
        if (!skills.length) { box.html('<span class="text-muted">No skills added yet.</span>'); return; }
        skills.forEach(function (s, i)
        {
            box.append('<span class="resume-skill-tag">' + esc(s) +
                ' <span class="rm" data-skill="' + i + '">&times;</span></span>');
        });
    }

    function addSkill(val)
    {
        val = (val || '').trim();
        if (!val) return;
        if (skills.map(function (s) { return s.toLowerCase(); }).indexOf(val.toLowerCase()) !== -1) return;
        skills.push(val);
        renderSkills();
    }

    $('#rAddSkillBtn').on('click', function () { addSkill($('#rSkillInput').val()); $('#rSkillInput').val('').focus(); });
    $('#rSkillInput').on('keydown', function (e)
    {
        if (e.key === 'Enter') { e.preventDefault(); addSkill($(this).val()); $(this).val('').focus(); }
    });
    $('#rSkillsList').on('click', '.rm', function ()
    {
        skills.splice(parseInt($(this).attr('data-skill')), 1);
        renderSkills();
    });

    // ─── Languages ───────────────────────────────────────────
    function addLangRow(name, level)
    {
        var row = $('<div class="resume-lang-row">' +
            '<input type="text" class="form-control lang-name" placeholder="Language (e.g. English)">' +
            '<input type="text" class="form-control lang-level" placeholder="Level (e.g. Fluent)">' +
            '<button type="button" class="site-button button-sm lang-rm" style="background:#dc3545;border-color:#dc3545;">&times;</button>' +
            '</div>');
        row.find('.lang-name').val(name || '');
        row.find('.lang-level').val(level || '');
        $('#rLangList').append(row);
    }
    $('#rAddLangBtn').on('click', function () { addLangRow('', ''); });
    $('#rLangList').on('click', '.lang-rm', function () { $(this).closest('.resume-lang-row').remove(); });

    function collectLanguages()
    {
        var langs = [];
        $('#rLangList .resume-lang-row').each(function ()
        {
            var name = $(this).find('.lang-name').val().trim();
            var level = $(this).find('.lang-level').val().trim();
            if (name) langs.push({ name: name, level: level || 'Basic' });
        });
        return langs;
    }

    // ─── Employment render ───────────────────────────────────
    function renderEmployment(list)
    {
        var box = $('#employmentList');
        box.empty();
        if (!list || !list.length) { box.html('<p class="text-muted">No employment added yet.</p>'); return; }
        list.forEach(function (w)
        {
            var date = fmtMonth(w.startDate) + ' — ' + (w.isCurrent ? 'Present' : (fmtMonth(w.endDate) || ''));
            box.append(
                '<div class="resume-item">' +
                '<div class="item-actions">' +
                '<a href="javascript:void(0);" class="edit-emp" data-id="' + w.id + '"><i class="fa fa-pencil"></i></a>' +
                '<a href="javascript:void(0);" class="del del-emp" data-id="' + w.id + '"><i class="fa fa-trash"></i></a>' +
                '</div>' +
                '<h6>' + esc(w.position) + '</h6>' +
                '<p class="sub">' + esc(w.company) + (w.location ? ' · ' + esc(w.location) : '') + '</p>' +
                '<span class="date">' + esc(date) + '</span>' +
                (w.description ? '<p class="desc">' + esc(w.description).replace(/\n/g, '<br>') + '</p>' : '') +
                '</div>'
            );
        });
    }

    // ─── Education render ────────────────────────────────────
    function renderEducation(list)
    {
        var box = $('#educationList');
        box.empty();
        if (!list || !list.length) { box.html('<p class="text-muted">No education added yet.</p>'); return; }
        list.forEach(function (e)
        {
            var date = (e.startYear || '') + ' — ' + (e.isCurrent ? 'Present' : (e.endYear || ''));
            box.append(
                '<div class="resume-item">' +
                '<div class="item-actions">' +
                '<a href="javascript:void(0);" class="edit-edu" data-id="' + e.id + '"><i class="fa fa-pencil"></i></a>' +
                '<a href="javascript:void(0);" class="del del-edu" data-id="' + e.id + '"><i class="fa fa-trash"></i></a>' +
                '</div>' +
                '<h6>' + esc(e.degree) + (e.field ? ', ' + esc(e.field) : '') + '</h6>' +
                '<p class="sub">' + esc(e.school) + '</p>' +
                '<span class="date">' + esc(date) + '</span>' +
                (e.description ? '<p class="desc">' + esc(e.description).replace(/\n/g, '<br>') + '</p>' : '') +
                '</div>'
            );
        });
    }

    // ─── Resume file ─────────────────────────────────────────
    function renderResumeFile(url)
    {
        if (url)
        {
            $('#currentResumeLink').attr('href', url);
            $('#currentResumeBox').show();
        }
        else { $('#currentResumeBox').hide(); }
    }

    // ─── Load ────────────────────────────────────────────────
    function load()
    {
        apiFetch('/candidates/me')
            .then(function (result)
            {
                $('#resumeLoading').hide();
                $('#resumeContent').show();
                if (!result.success || !result.data) return;
                var p = result.data;
                currentProfile = p;

                $('#rHeadline').val(p.headline || '');
                $('#rSummary').val(p.summary || '');
                $('#rLocation').val(p.location || '');
                skills = (p.skills || []).slice();
                renderSkills();

                $('#rLangList').empty();
                (p.languages || []).forEach(function (l) { addLangRow(l.name, l.level); });

                renderEmployment(p.workExperiences);
                renderEducation(p.educations);
                renderResumeFile(p.resumeUrl);

                // sidebar başlıq
                if (p.fullName) $('.candidate-info .candidate-title h4 a').first().text(p.fullName);
                if (p.headline) $('.candidate-info .candidate-title p a').first().text(p.headline);
            })
            .catch(function (err)
            {
                $('#resumeLoading').hide();
                $('#resumeContent').show();
                console.error('Resume load error:', err);
                showAlert('Could not load your resume. You can still edit and save.', 'warning');
            });
    }

    // ─── Save Resume Details (PUT — bütün profil sahələri ilə birgə) ───
    $('#resumeDetailsForm').on('submit', function (e)
    {
        e.preventDefault();
        $('#rSaveSpinner').show();
        $('#rSaveBtn').prop('disabled', true);

        var payload = {
            headline: $('#rHeadline').val().trim(),
            summary: $('#rSummary').val().trim(),
            location: $('#rLocation').val().trim(),
            website: currentProfile.website || '',
            linkedInUrl: currentProfile.linkedInUrl || '',
            githubUrl: currentProfile.githubUrl || '',
            experienceYears: currentProfile.experienceYears != null ? currentProfile.experienceYears : 0,
            currentPosition: currentProfile.currentPosition || '',
            expectedSalary: currentProfile.expectedSalary || '',
            isAvailable: currentProfile.isAvailable != null ? currentProfile.isAvailable : true,
            skills: skills,
            languages: collectLanguages()
        };

        apiFetch('/candidates/me', { method: 'PUT', body: JSON.stringify(payload) })
            .then(function (result)
            {
                $('#rSaveSpinner').hide();
                $('#rSaveBtn').prop('disabled', false);
                if (result && result.data) currentProfile = result.data;
                if (payload.headline) $('.candidate-info .candidate-title p a').first().text(payload.headline);
                showAlert('Resume details saved successfully.', 'success');
            })
            .catch(function (err)
            {
                $('#rSaveSpinner').hide();
                $('#rSaveBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Could not save resume details.';
                showAlert(msg, 'danger');
            });
    });

    // ─── Employment modal ────────────────────────────────────
    // Modal-ları birbaşa <body>-nin altına köçürürük. Əks halda onlar .page-wraper
    // içində qaldıqda Bootstrap backdrop-u modal məzmununun üstünə düşür və
    // input-lara fokus/yazı mümkün olmur.
    var empModalEl = document.getElementById('employmentModal');
    var eduModalEl = document.getElementById('educationModal');
    if (empModalEl && empModalEl.parentNode !== document.body) document.body.appendChild(empModalEl);
    if (eduModalEl && eduModalEl.parentNode !== document.body) document.body.appendChild(eduModalEl);

    var empModal = new bootstrap.Modal(empModalEl);
    var eduModal = new bootstrap.Modal(eduModalEl);

    function openEmpModal(w)
    {
        $('#employmentForm')[0].reset();
        $('#empId').val(w ? w.id : '');
        $('#employmentModalTitle').text(w ? 'Edit Employment' : 'Add Employment');
        if (w)
        {
            $('#empPosition').val(w.position || '');
            $('#empCompany').val(w.company || '');
            $('#empLocation').val(w.location || '');
            $('#empStart').val(dateOnly(w.startDate));
            $('#empEnd').val(dateOnly(w.endDate));
            $('#empCurrent').prop('checked', !!w.isCurrent);
            $('#empDescription').val(w.description || '');
        }
        empModal.show();
    }

    $('#addEmploymentBtn').on('click', function () { openEmpModal(null); });

    $('#employmentList').on('click', '.edit-emp', function ()
    {
        var id = parseInt($(this).attr('data-id'));
        var w = (currentProfile.workExperiences || []).filter(function (x) { return x.id === id; })[0];
        openEmpModal(w);
    });

    $('#empSaveBtn').on('click', function ()
    {
        var id = $('#empId').val();
        var position = $('#empPosition').val().trim();
        var company = $('#empCompany').val().trim();
        var start = $('#empStart').val();
        if (!position || !company || !start)
        {
            alert('Position, Company and Start Date are required.');
            return;
        }
        var isCurrent = $('#empCurrent').is(':checked');
        var dto = {
            company: company,
            position: position,
            location: $('#empLocation').val().trim(),
            startDate: start,
            endDate: isCurrent ? null : ($('#empEnd').val() || null),
            isCurrent: isCurrent,
            description: $('#empDescription').val().trim()
        };
        var btn = $('#empSaveBtn').prop('disabled', true);
        var url = id ? '/candidates/me/experience/' + id : '/candidates/me/experience';
        var method = id ? 'PUT' : 'POST';

        apiFetch(url, { method: method, body: JSON.stringify(dto) })
            .then(function () { btn.prop('disabled', false); empModal.hide(); reloadLists(); showAlert('Employment saved.', 'success'); })
            .catch(function (err)
            {
                btn.prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Could not save employment.';
                alert(msg);
            });
    });

    $('#employmentList').on('click', '.del-emp', function ()
    {
        var id = $(this).attr('data-id');
        if (!confirm('Delete this employment entry?')) return;
        apiFetch('/candidates/me/experience/' + id, { method: 'DELETE' })
            .then(function () { reloadLists(); })
            .catch(function () { alert('Could not delete the entry.'); });
    });

    // ─── Education modal ─────────────────────────────────────
    function openEduModal(e)
    {
        $('#educationForm')[0].reset();
        $('#eduId').val(e ? e.id : '');
        $('#educationModalTitle').text(e ? 'Edit Education' : 'Add Education');
        if (e)
        {
            $('#eduSchool').val(e.school || '');
            $('#eduDegree').val(e.degree || '');
            $('#eduField').val(e.field || '');
            $('#eduStartYear').val(e.startYear || '');
            $('#eduEndYear').val(e.endYear || '');
            $('#eduCurrent').prop('checked', !!e.isCurrent);
            $('#eduDescription').val(e.description || '');
        }
        eduModal.show();
    }

    $('#addEducationBtn').on('click', function () { openEduModal(null); });

    $('#educationList').on('click', '.edit-edu', function ()
    {
        var id = parseInt($(this).attr('data-id'));
        var e = (currentProfile.educations || []).filter(function (x) { return x.id === id; })[0];
        openEduModal(e);
    });

    $('#eduSaveBtn').on('click', function ()
    {
        var id = $('#eduId').val();
        var school = $('#eduSchool').val().trim();
        var degree = $('#eduDegree').val().trim();
        var startYear = parseInt($('#eduStartYear').val());
        if (!school || !degree || !startYear)
        {
            alert('School, Degree and Start Year are required.');
            return;
        }
        var isCurrent = $('#eduCurrent').is(':checked');
        var endYear = parseInt($('#eduEndYear').val());
        var dto = {
            school: school,
            degree: degree,
            field: $('#eduField').val().trim(),
            startYear: startYear,
            endYear: isCurrent ? null : (isNaN(endYear) ? null : endYear),
            isCurrent: isCurrent,
            description: $('#eduDescription').val().trim()
        };
        var btn = $('#eduSaveBtn').prop('disabled', true);
        var url = id ? '/candidates/me/education/' + id : '/candidates/me/education';
        var method = id ? 'PUT' : 'POST';

        apiFetch(url, { method: method, body: JSON.stringify(dto) })
            .then(function () { btn.prop('disabled', false); eduModal.hide(); reloadLists(); showAlert('Education saved.', 'success'); })
            .catch(function (err)
            {
                btn.prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Could not save education.';
                alert(msg);
            });
    });

    $('#educationList').on('click', '.del-edu', function ()
    {
        var id = $(this).attr('data-id');
        if (!confirm('Delete this education entry?')) return;
        apiFetch('/candidates/me/education/' + id, { method: 'DELETE' })
            .then(function () { reloadLists(); })
            .catch(function () { alert('Could not delete the entry.'); });
    });

    // Yalnız siyahıları yenilə (experience/education dəyişdikdə)
    function reloadLists()
    {
        apiFetch('/candidates/me')
            .then(function (result)
            {
                if (result && result.data)
                {
                    currentProfile = result.data;
                    renderEmployment(result.data.workExperiences);
                    renderEducation(result.data.educations);
                    renderResumeFile(result.data.resumeUrl);
                }
            })
            .catch(function () { /* keç */ });
    }

    // ─── Attach Resume (PDF) ─────────────────────────────────
    $('#uploadResumeBtn').on('click', function ()
    {
        var file = $('#resumeFileInput')[0].files[0];
        if (!file) { alert('Please choose a file first.'); return; }
        $('#uploadResumeSpinner').show();
        var btn = $(this).prop('disabled', true);
        var fd = new FormData();
        fd.append('file', file);
        apiFetch('/candidates/me/resume', { method: 'POST', body: fd })
            .then(function (result)
            {
                $('#uploadResumeSpinner').hide();
                btn.prop('disabled', false);
                $('#resumeFileInput').val('');
                var url = result && result.data && result.data.url;
                renderResumeFile(url);
                showAlert('Resume file uploaded successfully.', 'success');
            })
            .catch(function (err)
            {
                $('#uploadResumeSpinner').hide();
                btn.prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Could not upload the file.';
                showAlert(msg, 'danger');
            });
    });

    $('#deleteResumeBtn').on('click', function ()
    {
        if (!confirm('Delete your uploaded resume file?')) return;
        apiFetch('/candidates/me/resume', { method: 'DELETE' })
            .then(function () { renderResumeFile(null); showAlert('Resume file deleted.', 'success'); })
            .catch(function () { alert('Could not delete the resume file.'); });
    });

    // ─── Avatar upload (sidebar camera) ──────────────────────
    $('#resumeAvatarInput').on('change', function ()
    {
        var file = this.files && this.files[0];
        if (!file) return;
        var img = $('.candidate-info .canditate-des > a img').first();
        img.attr('src', URL.createObjectURL(file));
        var fd = new FormData();
        fd.append('file', file);
        apiFetch('/candidates/me/avatar', { method: 'POST', body: fd })
            .then(function (result)
            {
                var url = result && result.data && result.data.url;
                if (url)
                {
                    var bust = url + (url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
                    img.attr('src', bust).attr('onerror', "this.src='images/team/pic1.jpg'");
                    try
                    {
                        var u = JSON.parse(localStorage.getItem('user') || '{}');
                        u.avatarUrl = url;
                        localStorage.setItem('user', JSON.stringify(u));
                    } catch (e) { /* keç */ }
                }
                showAlert('Profile photo updated.', 'success');
            })
            .catch(function () { showAlert('Could not upload photo.', 'danger'); });
    });

    load();
});
