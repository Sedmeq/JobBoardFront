/**
 * Transactions integration.
 * Dokumentasiya:
 *   GET /api/transactions?status=&type=&page=&pageSize=
 *   GET /api/transactions/{id}/invoice
 */
$(document).ready(function ()
{
    var body = $('#transactionsBody');
    if (!body.length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var pagination = $('#transactionsPagination');
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

    function fetchTransactions(page)
    {
        currentPage = page || 1;
        body.html('<tr><td colspan="6" class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i></td></tr>');
        pagination.empty();

        apiFetch('/transactions?page=' + currentPage + '&pageSize=' + pageSize)
            .then(function (result)
            {
                body.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    body.html('<tr><td colspan="6" class="text-center p-a30"><h5>No transactions yet</h5></td></tr>');
                    return;
                }
                result.data.items.forEach(function (t)
                {
                    var amount = (t.amount != null ? t.amount.toFixed(2) : '0.00') + ' ' + (t.currency || 'USD');
                    var method = (t.paymentMethod || '').replace('_', ' ');
                    body.append(
                        '<tr>' +
                        '<td class="order-id text-primary">#' + escapeHtml(t.orderId || t.id) + '</td>' +
                        '<td class="job-name"><a href="javascript:void(0);" style="text-transform:capitalize;">' + escapeHtml((t.transactionType || '').replace(/_/g, ' ')) + '</a></td>' +
                        '<td class="amount text-primary">' + escapeHtml(amount) + '</td>' +
                        '<td class="date">' + formatDate(t.createdAt) + '</td>' +
                        '<td class="transfer" style="text-transform:capitalize;">' + escapeHtml(method || '-') + '</td>' +
                        statusCell(t.status) +
                        '</tr>'
                    );
                });
                renderPagination(result.data.pageCount, result.data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Transactions fetch error:', err);
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
            if (p && p !== currentPage && p >= 1 && p <= pageCount) fetchTransactions(p);
        });
    }

    fetchTransactions(1);
});
