/**
 * Browse Jobs — Filter List (tam funksional).
 * Backend: GET /api/jobs?keyword=&location=&categoryId=&jobType=&experienceLevel=
 *                        &salaryMin=&salaryMax=&isRemote=&sortBy=&page=&pageSize=
 */
$(document).ready(function ()
{
    var body = $('#bjlJobsBody');
    if (!body.length) return;

    var pagination = $('#bjlPagination');
    var foundLabel = $('#bjlFoundLabel');
    var currentPage = 1;
    var pageSize = 8;

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function timeAgo(d)
    {
        if (!d) return '';
        var s = Math.floor((new Date() - new Date(d)) / 1000);
        if (s < 60) return 'just now';
        var m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
        var h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
        var days = Math.floor(h / 24); return days === 1 ? 'yesterday' : days + 'd ago';
    }

    function salary(j)
    {
        if (!j.isSalaryVisible || (!j.salaryMin && !j.salaryMax)) return 'Negotiable';
        var cur = j.salaryCurrency || 'AZN';
        if (j.salaryMin && j.salaryMax) return j.salaryMin + ' - ' + j.salaryMax + ' ' + cur;
        return (j.salaryMin || j.salaryMax) + ' ' + cur;
    }

    // URL parametrləri (homepage axtarışından deep-link)
    var params = new URLSearchParams(window.location.search);
    $('#bjlKeyword').val(params.get('keyword') || '');
    $('#bjlLocation').val(params.get('location') || '');

    // Kateqoriyaları yüklə
    function loadCategories()
    {
        apiFetch('/categories?includeJobCount=false')
            .then(function (result)
            {
                var items = (result && result.data) || [];
                var sel = $('#bjlCategory');
                items.forEach(function (c)
                {
                    sel.append('<option value="' + c.id + '">' + esc(c.name) + '</option>');
                });
                var initCat = params.get('categoryId') || params.get('category');
                if (initCat) sel.val(String(initCat));
                refreshPicker(sel);
            })
            .catch(function (err) { console.error('Categories load error:', err); });
    }

    // custom.js bütün select-ləri bootstrap-select widget-inə çevirir; AJAX-la əlavə olunan
    // option-ların görünməsi üçün widget-i yeniləyirik.
    function refreshPicker(select)
    {
        if (!$.fn.selectpicker) return;
        var doRefresh = function ()
        {
            try { select.selectpicker('refresh'); } catch (e) { }
        };
        if (document.readyState === 'complete') doRefresh();
        else $(window).on('load', doRefresh);
    }

    function selectedTypes()
    {
        var types = [];
        $('.bjl-type:checked').each(function () { types.push($(this).val()); });
        return types.join(',');
    }

    function buildQuery()
    {
        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        q.push('sortBy=' + ($('#bjlSort').val() || 'newest'));

        var kw = $('#bjlKeyword').val().trim();
        var loc = $('#bjlLocation').val().trim();
        var cat = $('#bjlCategory').val();
        var types = selectedTypes();
        var exp = $('#bjlExp').val();
        var sMin = $('#bjlSalaryMin').val();
        var sMax = $('#bjlSalaryMax').val();
        var remote = $('#bjlRemote').is(':checked');

        if (kw) q.push('keyword=' + encodeURIComponent(kw));
        if (loc) q.push('location=' + encodeURIComponent(loc));
        if (cat) q.push('categoryId=' + encodeURIComponent(cat));
        if (types) q.push('jobType=' + encodeURIComponent(types));
        if (exp) q.push('experienceLevel=' + encodeURIComponent(exp));
        if (sMin) q.push('salaryMin=' + encodeURIComponent(sMin));
        if (sMax) q.push('salaryMax=' + encodeURIComponent(sMax));
        if (remote) q.push('isRemote=true');

        return q.join('&');
    }

    function fetchJobs(page)
    {
        currentPage = page || 1;
        body.html('<li class="col-12 text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading jobs...</p></li>');
        pagination.empty();
        foundLabel.text('Loading...');

        apiFetch('/jobs?' + buildQuery())
            .then(function (result)
            {
                body.empty();
                var data = (result && result.data) || {};
                if (!data.items || !data.items.length)
                {
                    foundLabel.text('0 Jobs Found');
                    body.html('<li class="col-12 text-center p-a30"><h5>No matching jobs found</h5><p class="text-muted">Try adjusting your filters.</p></li>');
                    return;
                }
                foundLabel.text(data.totalCount + ' Jobs Found');

                data.items.forEach(function (j)
                {
                    var logo = (j.company && j.company.logoUrl) || 'images/logo/icon3.jpg';
                    var company = (j.company && j.company.name) || 'Company';
                    body.append(
                        '<li class="col-12">' +
                        '<div class="post-bx">' +
                        '<div class="d-flex m-b20 align-items-center">' +
                        '<div class="job-post-company me-3"><span>' +
                        '<img src="' + esc(logo) + '" onerror="this.src=\'images/logo/icon3.jpg\'" alt="" ' +
                        'style="width:56px;height:56px;border-radius:8px;object-fit:contain;background:#f4f5f9;padding:4px;"></span></div>' +
                        '<div class="job-post-info">' +
                        '<h5 class="m-b0"><a href="job-detail.html?id=' + j.id + '">' + esc(j.title) + '</a></h5>' +
                        '<p class="m-b5 font-13 text-muted">' + esc(company) + '</p>' +
                        '<ul>' +
                        '<li><i class="fas fa-map-marker-alt"></i> ' + esc(j.location || 'Remote') + '</li>' +
                        '<li><i class="far fa-bookmark"></i> ' + esc(j.jobType || 'Full-time') + '</li>' +
                        '<li><i class="far fa-money-bill-alt"></i> ' + esc(salary(j)) + '</li>' +
                        '<li><i class="far fa-clock"></i> ' + timeAgo(j.createdAt) + '</li>' +
                        '</ul>' +
                        '</div>' +
                        '</div>' +
                        '<div class="d-flex" style="gap:8px;">' +
                        '<a href="job-detail.html?id=' + j.id + '" class="site-button button-sm">View Details</a>' +
                        '</div>' +
                        '</div>' +
                        '</li>'
                    );
                });

                renderPagination(data.pageCount, data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Jobs fetch error:', err);
                foundLabel.text('Error');
                body.html('<li class="col-12 text-center p-a30"><p class="text-danger">Failed to load jobs. Please try again.</p></li>');
            });
    }

    function renderPagination(pageCount, hasNextPage)
    {
        pagination.empty();
        if (!pageCount || pageCount <= 1) return;
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
            if (p && p !== currentPage && p >= 1 && p <= pageCount)
            {
                fetchJobs(p);
                $('html, body').animate({ scrollTop: $('.browse-job-find').offset().top - 80 }, 300);
            }
        });
    }

    // Hadisələr
    $('#bjlSearchForm').on('submit', function (e) { e.preventDefault(); fetchJobs(1); });
    $('#bjlApply').on('click', function () { fetchJobs(1); });
    $('#bjlSort').on('change', function () { fetchJobs(1); });
    $('#bjlCategory, #bjlExp').on('change', function () { fetchJobs(1); });
    $('.bjl-type, #bjlRemote').on('change', function () { fetchJobs(1); });
    $('#bjlReset').on('click', function ()
    {
        $('#bjlKeyword, #bjlLocation, #bjlSalaryMin, #bjlSalaryMax').val('');
        $('#bjlCategory').val('');
        $('#bjlExp').val('');
        $('#bjlSort').val('newest');
        $('.bjl-type').prop('checked', false);
        $('#bjlRemote').prop('checked', false);
        fetchJobs(1);
    });

    loadCategories();
    fetchJobs(1);
});
