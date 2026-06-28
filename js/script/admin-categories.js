/**
 * Admin — Create Category.
 * Dokumentasiya: POST /api/admin/categories  { name, description, icon }
 */
$(document).ready(function ()
{
    var form = $('#categoryForm');
    if (!form.length) return;

    var alertEl = $('#catAlert');

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + (type || 'info')).html(msg).slideDown(200);
        if (type !== 'success') setTimeout(function () { alertEl.slideUp(200); }, 6000);
    }

    form.on('submit', function (e)
    {
        e.preventDefault();
        var name = $('#catName').val().trim();
        if (!name) { showAlert('Category name is required.', 'danger'); return; }

        var payload = {
            name: name,
            description: $('#catDescription').val().trim(),
            icon: $('#catIcon').val().trim()
        };

        $('#catSpinner').show();
        $('#catSubmitBtn').prop('disabled', true);

        apiFetch('/admin/categories', { method: 'POST', body: JSON.stringify(payload) })
            .then(function (result)
            {
                $('#catSpinner').hide();
                $('#catSubmitBtn').prop('disabled', false);
                showAlert(result.message || 'Category created successfully.', 'success');
                form[0].reset();
            })
            .catch(function (err)
            {
                $('#catSpinner').hide();
                $('#catSubmitBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to create category. Please try again.';
                showAlert(msg, 'danger');
            });
    });
});
