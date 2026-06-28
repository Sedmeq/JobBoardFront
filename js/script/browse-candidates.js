/**
 * Browse Candidates integration (Employer/Admin).
 * Dokumentasiya:
 *   GET /api/candidates?keyword=&experience=&page=&pageSize=
 */
$(document).ready(function ()
{
    var container = $('#candidatesContainer');
    if (!container.length) return;

    var pagination = $('#candidatesPagination');
    var foundLabel = $('#candFoundLabel');
    var currentPage = 1;
    var pageSize = 8;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function fetchCandidates(page)
    {
        currentPage = page || 1;
        var keyword = ($('#candSearchKeyword').val() || '').trim();
        var experience = $('#candSearchExperience').val();

        container.html('<li class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading candidates...</p></li>');
        pagination.empty();
        foundLabel.text('Loading...');

        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        if (keyword) q.push('keyword=' + encodeURIComponent(keyword));
        if (experience) q.push('experience=' + encodeURIComponent(experience));

        apiFetch('/candidates?' + q.join('&'))
            .then(function (result)
            {
                container.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    foundLabel.text('0 Candidates');
                    container.html('<li class="text-center p-a30"><h4>No candidates found</h4><p class="text-muted">Try adjusting your search.</p></li>');
                    return;
                }
                var data = result.data;
                foundLabel.text(data.totalCount + ' Candidates Found');

                data.items.forEach(function (c)
                {
                    var avatar = c.avatarUrl || 'images/testimonials/pic1.jpg';
                    container.append(
                        '<li>' +
                        '<div class="post-bx">' +
                        '<div class="d-flex m-b30">' +
                        '<div class="job-post-company"><a href="candidates/' + c.id + '"><span>' +
                        '<img alt="' + escapeHtml(c.fullName) + '" src="' + avatar + '" onerror="this.src=\'images/testimonials/pic1.jpg\'" />' +
                        '</span></a></div>' +
                        '<div class="job-post-info">' +
                        '<h4><a href="javascript:void(0);">' + escapeHtml(c.fullName || 'Candidate') + '</a></h4>' +
                        '<ul>' +
                        '<li><i class="fas fa-user-tie"></i> ' + escapeHtml(c.headline || c.currentPosition || 'Professional') + '</li>' +
                        '<li><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(c.location || 'N/A') + '</li>' +
                        '<li><i class="far fa-clock"></i> ' + (c.experienceYears != null ? c.experienceYears + ' yrs exp.' : 'Experience N/A') + '</li>' +
                        '</ul>' +
                        '</div>' +
                        '</div>' +
                        '<div class="d-flex">' +
                        '<div class="job-time me-auto"><a href="javascript:void(0);"><span>' + escapeHtml(c.currentPosition || 'Available') + '</span></a></div>' +
                        '<div class="salary-bx"><span>' + escapeHtml(c.email || '') + '</span></div>' +
                        '</div>' +
                        '</div>' +
                        '</li>'
                    );
                });

                renderPagination(data.pageCount, data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Candidates fetch error:', err);
                foundLabel.text('Error');
                if (err && err.status === 403)
                {
                    container.html('<li class="text-center p-a30"><p class="text-danger">Only employers can browse candidates. Please sign in with an employer account.</p></li>');
                } else
                {
                    container.html('<li class="text-center p-a30"><p class="text-danger">Failed to load candidates. Please try again.</p></li>');
                }
            });
    }

    function renderPagination(pageCount, hasNextPage)
    {
        pagination.empty();
        if (pageCount <= 1) return;
        pagination.append('<li class="previous ' + (currentPage === 1 ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage - 1) + '"><i class="ti-arrow-left"></i> Prev</a></li>');
        for (var i = 1; i <= pageCount; i++)
        {
            pagination.append('<li class="' + (i === currentPage ? 'active' : '') + '"><a href="javascript:void(0);" data-page="' + i + '">' + i + '</a></li>');
        }
        pagination.append('<li class="next ' + (!hasNextPage ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage + 1) + '">Next <i class="ti-arrow-right"></i></a></li>');
        pagination.find('a').off('click').on('click', function (e)
        {
            e.preventDefault();
            var p = parseInt($(this).attr('data-page'));
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchCandidates(p);
        });
    }

    $('#candidateSearchForm').on('submit', function (e) { e.preventDefault(); fetchCandidates(1); });

    fetchCandidates(1);
});
