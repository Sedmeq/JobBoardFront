/**
 * CV Manager (Candidate) — yaradılan CV-ni (cv-view) və yüklənmiş CV faylını idarə edir.
 * Backend:
 *   GET    /api/candidates/me           (resumeUrl)
 *   POST   /api/candidates/me/resume (file)
 *   DELETE /api/candidates/me/resume
 * Generated CV: cv-view.html?me=1 (PDF kimi endirilə bilər)
 */
$(document).ready(function ()
{
    if (!$('#cvmContent').length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var msgEl = $('#cvmMessage');

    function showMessage(msg, type)
    {
        msgEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert alert-' + (type || 'info')).html(msg).slideDown(200);
        if (type === 'success') setTimeout(function () { msgEl.slideUp(200); }, 5000);
    }

    function renderResume(url)
    {
        if (url)
        {
            var name = url.split('/').pop();
            $('#cvmResumeStatus').html('Current file: <strong>' + $('<div>').text(name).html() + '</strong>');
            $('#cvmResumeDownload').attr('href', url);
            $('#cvmResumeActions').show();
        }
        else
        {
            $('#cvmResumeStatus').text('No file uploaded yet.');
            $('#cvmResumeActions').hide();
        }
    }

    function load()
    {
        apiFetch('/candidates/me')
            .then(function (result)
            {
                $('#cvmLoading').hide();
                $('#cvmContent').show();
                var p = (result && result.data) || {};
                renderResume(p.resumeUrl);
                if (p.fullName) $('.candidate-info .candidate-title h4 a').first().text(p.fullName);
                if (p.headline) $('.candidate-info .candidate-title p a').first().text(p.headline);
            })
            .catch(function (err)
            {
                $('#cvmLoading').hide();
                $('#cvmContent').show();
                console.error('CV Manager load error:', err);
                showMessage('Could not load your CV data.', 'warning');
            });
    }

    $('#cvmUploadBtn').on('click', function ()
    {
        var file = $('#cvmFileInput')[0].files[0];
        if (!file) { alert('Please choose a file first.'); return; }
        $('#cvmUploadSpinner').show();
        var btn = $(this).prop('disabled', true);
        var fd = new FormData();
        fd.append('file', file);
        apiFetch('/candidates/me/resume', { method: 'POST', body: fd })
            .then(function (result)
            {
                $('#cvmUploadSpinner').hide();
                btn.prop('disabled', false);
                $('#cvmFileInput').val('');
                renderResume(result && result.data && result.data.url);
                showMessage('Resume uploaded successfully.', 'success');
            })
            .catch(function (err)
            {
                $('#cvmUploadSpinner').hide();
                btn.prop('disabled', false);
                var m = (err && err.data && err.data.error && err.data.error.message) || 'Could not upload the file.';
                showMessage(m, 'danger');
            });
    });

    $('#cvmResumeDelete').on('click', function ()
    {
        if (!confirm('Delete your uploaded resume file?')) return;
        apiFetch('/candidates/me/resume', { method: 'DELETE' })
            .then(function () { renderResume(null); showMessage('Resume file deleted.', 'success'); })
            .catch(function () { showMessage('Could not delete the file.', 'danger'); });
    });

    load();
});
