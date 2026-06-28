/**
 * Companies listing integration.
 * Dokumentasiya:
 *   GET /api/companies?keyword=&industry=&location=&page=&pageSize=
 */
$(document).ready(function ()
{
    var container = $('#masonry');
    if (!container.length) return;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    container.html('<li class="col-12 text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading companies...</p></li>');

    apiFetch('/companies?page=1&pageSize=24')
        .then(function (result)
        {
            container.empty();
            if (!result.success || !result.data || !result.data.items || !result.data.items.length)
            {
                container.html('<li class="col-12 text-center p-a30"><h4>No companies found</h4></li>');
                return;
            }
            result.data.items.forEach(function (c)
            {
                var logo = c.logoUrl || 'images/logo/logo/logo1.png';
                container.append(
                    '<li class="card-container col-lg-3 col-md-4 col-sm-4">' +
                    '<div class="dez-gallery-box">' +
                    '<div class="dez-media overlay-black-light">' +
                    '<a href="company-profile.html?id=' + c.id + '"> <img src="' + logo + '" alt="' + escapeHtml(c.name) + '" onerror="this.src=\'images/logo/logo/logo1.png\'"> </a>' +
                    '<div class="overlay-icon overlay-logo" style="text-align:center;">' +
                    '<a href="company-profile.html?id=' + c.id + '" class="text-white">' +
                    '<h5 class="text-white m-a0">' + escapeHtml(c.name) + '</h5>' +
                    '<span class="text-white">' + escapeHtml(c.industry || '') + (c.location ? ' · ' + escapeHtml(c.location) : '') + '</span><br>' +
                    '<span class="text-white">' + (c.jobsCount != null ? c.jobsCount + ' open jobs' : '') + '</span>' +
                    '</a>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</li>'
                );
            });

            // Masonry layout-u yenilə (mövcuddursa)
            if (container.data('masonry') || $.fn.masonry)
            {
                try { container.masonry('reloadItems').masonry('layout'); } catch (e) { }
            }
        })
        .catch(function (err)
        {
            console.error('Companies fetch error:', err);
            container.html('<li class="col-12 text-center p-a30"><p class="text-danger">Failed to load companies. Please try again.</p></li>');
        });
});
