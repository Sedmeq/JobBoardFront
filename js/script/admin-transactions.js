/**
 * Admin — Manage Transactions.
 * Dokumentasiya: GET /api/admin/transactions?status=&page=&pageSize=
 */
$(document).ready(function ()
{
    var body = $('#adminTxBody');
    if (!body.length) return;

    var pagination = $('#adminTxPagination');
    var currentPage = 1;
    var pageSize = 10;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function formatDate(d)
    {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function statusCell(status)
    {
        var cls = (status === 'completed') ? 'success' : (status === 'failed' ? 'text-red' : 'pending');
        return '<td class="expired ' + cls + '" style="text-transform:capitalize;">' + escapeHtml(status || 'pending') + '</td>';
    }

    function fetchTx(page)
    {
        currentPage = page || 1;
        var status = $('#adminTxStatus').val();

        body.html('<tr><td colspan="6" class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        pagination.empty();

        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        if (status) q.push('status=' + encodeURIComponent(status));

        apiFetch('/admin/transactions?' + q.join('&'))
            .then(function (result)
            {
                body.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    body.html('<tr><td colspan="6" class="text-center p-a30"><h5>No transactions found</h5></td></tr>');
                    return;
                }
                result.data.items.forEach(function (t)
                {
                    var amount = (t.amount != null ? t.amount.toFixed(2) : '0.00') + ' ' + (t.currency || 'USD');
                    body.append(
                        '<tr>' +
                        '<td class="order-id text-primary">#' + escapeHtml(t.orderId || t.id) + '</td>' +
                        '<td style="text-transform:capitalize;">' + escapeHtml((t.transactionType || '').replace(/_/g, ' ')) + '</td>' +
                        '<td class="text-primary">' + escapeHtml(amount) + '</td>' +
                        '<td>' + formatDate(t.createdAt) + '</td>' +
                        '<td style="text-transform:capitalize;">' + escapeHtml((t.paymentMethod || '-').replace(/_/g, ' ')) + '</td>' +
                        statusCell(t.status) +
                        '</tr>'
                    );
                });
                renderPagination(result.data.pageCount, result.data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Admin transactions error:', err);
                body.html('<tr><td colspan="6" class="text-center p-a30"><p class="text-danger">Failed to load transactions. Please try again.</p></td></tr>');
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
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchTx(p);
        });
    }

    $('#adminTxStatus').on('change', function () { fetchTx(1); });

    fetchTx(1);
});
