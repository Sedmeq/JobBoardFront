/**
 * AI CV Analyzer (candidate / employer ödənişli, admin pulsuz).
 * Backend:
 *   GET  /api/cv-analyzer/status
 *   POST /api/cv-analyzer/analyze   { cvText, extraInfo }
 *   POST /api/cv-analyzer/checkout  -> Stripe checkout URL
 *   POST /api/cv-analyzer/confirm   { sessionId }
 */
$(document).ready(function ()
{
    if (!$('#aiTool').length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var params = new URLSearchParams(window.location.search);
    var role = 'candidate';
    try { role = (JSON.parse(localStorage.getItem('user') || '{}').role || 'candidate').toLowerCase(); } catch (e) { }

    function showAlert(msg, type)
    {
        $('#aiAlert').removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert alert-' + (type || 'info')).html(msg).slideDown(200);
        if (type !== 'success') setTimeout(function () { $('#aiAlert').slideUp(200); }, 7000);
    }

    function fmtPrice(s) { return '$' + Number(s.price || 0).toFixed(2); }

    function renderAccess(status)
    {
        $('#aiLoading').hide();
        var badge = $('#aiStatusBadge');
        if (status.isFree)
            badge.html('<span class="ai-badge free"><i class="fa fa-crown"></i> Admin — Free access</span>');
        else if (status.hasAccess)
            badge.html('<span class="ai-badge ok"><i class="fa fa-check"></i> Premium unlocked</span>');
        else
            badge.html('<span class="ai-badge paid">Premium — ' + fmtPrice(status) + ' (one-time)</span>');

        if (status.hasAccess)
        {
            $('#aiPaywall').hide();
            $('#aiTool').show();
            prefillCv();
        }
        else
        {
            $('#aiPaywallText').text('Unlock the AI CV Analyzer with a one-time payment of ' + fmtPrice(status) + '.');
            $('#aiPaywall').show();
            $('#aiTool').hide();
        }
    }

    function loadStatus()
    {
        return apiFetch('/cv-analyzer/status')
            .then(function (res) { renderAccess((res && res.data) || {}); })
            .catch(function ()
            {
                $('#aiLoading').hide();
                showAlert('Status yüklənə bilmədi.', 'danger');
            });
    }

    // CV mətnini candidate profilindən prefill et
    function prefillCv()
    {
        if (role !== 'candidate') return;
        if ($('#aiCvText').val().trim()) return;
        apiFetch('/candidates/me')
            .then(function (res)
            {
                var p = res && res.data;
                if (!p) return;
                var lines = [];
                if (p.fullName) lines.push('Name: ' + p.fullName);
                if (p.email) lines.push('Email: ' + p.email);
                if (p.headline) lines.push('Headline: ' + p.headline);
                if (p.currentPosition) lines.push('Current Position: ' + p.currentPosition);
                if (p.experienceYears != null) lines.push('Experience Years: ' + p.experienceYears);
                if (p.location) lines.push('Location: ' + p.location);
                if (p.summary) lines.push('Summary: ' + p.summary);
                if (p.skills && p.skills.length) lines.push('Skills: ' + p.skills.join(', '));
                (p.workExperiences || []).forEach(function (w)
                {
                    lines.push('Experience: ' + (w.position || '') + ' at ' + (w.company || '') + (w.description ? ' — ' + w.description : ''));
                });
                (p.educations || []).forEach(function (e)
                {
                    lines.push('Education: ' + (e.degree || '') + ' ' + (e.field || '') + ', ' + (e.school || ''));
                });
                $('#aiCvText').val(lines.join('\n'));
            })
            .catch(function () { });
    }

    // ─── Analyze ─────────────────────────────────────────────
    function renderResult(text)
    {
        $('#aiResult').text(text || '');
        $('#aiResultWrap').show();
        $('html, body').animate({ scrollTop: $('#aiResultWrap').offset().top - 80 }, 300);
    }

    function handleAnalyzeError(err)
    {
        var msg = (err && err.data && err.data.error && err.data.error.message) || 'Analiz alınmadı.';
        showAlert(msg, 'danger');
        if (err && err.status === 403) loadStatus();
    }

    $('#aiAnalyzeBtn').on('click', function ()
    {
        var cvText = $('#aiCvText').val().trim();
        var extra = $('#aiExtra').val().trim();
        if (!cvText && !extra) { showAlert('Zəhmət olmasa CV mətni və ya əlavə məlumat daxil edin.', 'danger'); return; }

        $('#aiAnalyzeSpinner').show();
        $('#aiAnalyzeBtn').prop('disabled', true);
        $('#aiResultWrap').hide();

        apiFetch('/cv-analyzer/analyze', {
            method: 'POST',
            body: JSON.stringify({ cvText: cvText, extraInfo: extra })
        })
            .then(function (res)
            {
                $('#aiAnalyzeSpinner').hide();
                $('#aiAnalyzeBtn').prop('disabled', false);
                renderResult((res && res.data && res.data.analysis) || '');
            })
            .catch(function (err)
            {
                $('#aiAnalyzeSpinner').hide();
                $('#aiAnalyzeBtn').prop('disabled', false);
                handleAnalyzeError(err);
            });
    });

    // ─── Analyze uploaded file (PDF/DOCX/TXT) ────────────────
    $('#aiCvFile').on('change', function ()
    {
        var f = this.files && this.files[0];
        $('#aiFileName').text(f ? ('Seçilən fayl: ' + f.name) : '');
    });

    $('#aiAnalyzeFileBtn').on('click', function ()
    {
        var input = document.getElementById('aiCvFile');
        var f = input && input.files && input.files[0];
        if (!f) { showAlert('Zəhmət olmasa kompüterdən CV faylı seçin.', 'danger'); return; }

        var name = (f.name || '').toLowerCase();
        if (!/\.(pdf|docx|txt)$/.test(name)) { showAlert('Yalnız PDF, DOCX və ya TXT faylı yükləyin.', 'danger'); return; }
        if (f.size > 10 * 1024 * 1024) { showAlert('Fayl 10 MB-dan böyük olmamalıdır.', 'danger'); return; }

        var fd = new FormData();
        fd.append('file', f);
        var extra = $('#aiExtra').val().trim();
        if (extra) fd.append('extraInfo', extra);

        $('#aiFileSpinner').show();
        $('#aiAnalyzeFileBtn').prop('disabled', true);
        $('#aiResultWrap').hide();

        apiFetch('/cv-analyzer/analyze-file', { method: 'POST', body: fd })
            .then(function (res)
            {
                $('#aiFileSpinner').hide();
                $('#aiAnalyzeFileBtn').prop('disabled', false);
                renderResult((res && res.data && res.data.analysis) || '');
            })
            .catch(function (err)
            {
                $('#aiFileSpinner').hide();
                $('#aiAnalyzeFileBtn').prop('disabled', false);
                handleAnalyzeError(err);
            });
    });

    // ─── Buy / Checkout ──────────────────────────────────────
    $('#aiBuyBtn').on('click', function ()
    {
        $('#aiBuySpinner').show();
        $('#aiBuyBtn').prop('disabled', true);
        apiFetch('/cv-analyzer/checkout', { method: 'POST' })
            .then(function (res)
            {
                var url = res && res.data && res.data.checkoutUrl;
                if (url) { window.location.href = url; }
                else { $('#aiBuySpinner').hide(); $('#aiBuyBtn').prop('disabled', false); showAlert('Ödəniş linki alınmadı.', 'danger'); }
            })
            .catch(function (err)
            {
                $('#aiBuySpinner').hide();
                $('#aiBuyBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Ödəniş başladıla bilmədi.';
                showAlert(msg, 'danger');
            });
    });

    // ─── Stripe redirect-dən qayıdış ─────────────────────────
    var sessionId = params.get('session_id');
    if (params.get('canceled') === '1')
    {
        showAlert('Ödəniş ləğv edildi.', 'warning');
    }
    if (sessionId)
    {
        $('#aiLoading').show();
        apiFetch('/cv-analyzer/confirm', { method: 'POST', body: JSON.stringify({ sessionId: sessionId }) })
            .then(function (res)
            {
                if (res && res.data && res.data.paid) showAlert('Ödəniş təsdiqləndi! AI CV Analyzer açıldı.', 'success');
                else showAlert('Ödəniş təsdiqlənmədi. Əgər məbləğ çıxılıbsa, dəstəklə əlaqə saxlayın.', 'warning');
                // URL-i təmizlə
                window.history.replaceState({}, document.title, 'cv-analyzer.html');
                return loadStatus();
            })
            .catch(function () { loadStatus(); });
    }
    else
    {
        loadStatus();
    }
});
