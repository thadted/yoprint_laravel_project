import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function ProductsList({ products = { data: [], total: 0 }, filters = {} }) {
    // Add safe fallbacks for filters
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [sortField, setSortField] = useState(filters?.sort || 'updated_at');
    const [sortDirection, setSortDirection] = useState(filters?.direction || 'desc');

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('products.index'), {
            search: searchTerm,
            sort: sortField,
            direction: sortDirection,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // Handle sort
    const handleSort = (field) => {
        const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        
        router.get(route('products.index'), {
            search: searchTerm,
            sort: field,
            direction: direction,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
        router.get(route('products.index'), {
            sort: sortField,
            direction: sortDirection,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Get sort icon
    const getSortIcon = (field) => {
        if (sortField !== field) {
            return (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
            );
        }
        
        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Products
                    </h2>
                    <div className="text-sm text-gray-600">
                        {products?.total ? `${products.total} total products` : 'No products'}
                    </div>
                </div>
            }
        >
            <Head title="Products" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Product Inventory
                                </h3>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => router.get(route('file-manager'))}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Upload New File
                                    </button>
                                </div>
                            </div>

                            {/* Search Filter */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <form onSubmit={handleSearch} className="flex items-center space-x-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Search Products
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search by title, style, color, unique key..."
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pr-10"
                                            />
                                            {searchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={clearSearch}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-end space-x-2">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Search
                                        </button>
                                        
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={clearSearch}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </form>
                                
                                {/* Search Results Info */}
                                {searchTerm && (
                                    <div className="mt-3 text-sm text-gray-600">
                                        {(products?.total || 0) > 0 ? (
                                            <>Found {products.total} products matching "{searchTerm}"</>
                                        ) : (
                                            <>No products found matching "{searchTerm}"</>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Products Table */}
                            {products?.data && products.data.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th 
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        onClick={() => handleSort('unique_key')}
                                                    >
                                                        <div className="flex items-center space-x-1">
                                                            <span>Unique Key</span>
                                                            {getSortIcon('unique_key')}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        onClick={() => handleSort('product_title')}
                                                    >
                                                        <div className="flex items-center space-x-1">
                                                            <span>Product Title</span>
                                                            {getSortIcon('product_title')}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        onClick={() => handleSort('style_number')}
                                                    >
                                                        <div className="flex items-center space-x-1">
                                                            <span>Style Number</span>
                                                            {getSortIcon('style_number')}
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Color & Size
                                                    </th>
                                                    <th 
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        onClick={() => handleSort('piece_price')}
                                                    >
                                                        <div className="flex items-center space-x-1">
                                                            <span>Price</span>
                                                            {getSortIcon('piece_price')}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                        onClick={() => handleSort('updated_at')}
                                                    >
                                                        <div className="flex items-center space-x-1">
                                                            <span>Last Updated</span>
                                                            {getSortIcon('updated_at')}
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {products.data.map((product) => (
                                                    <tr key={product.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {product.unique_key}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {product.product_title}
                                                            </div>
                                                            {product.product_description && (
                                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                    {product.product_description}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {product.style_number}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {product.color_name && (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                                                        {product.color_name}
                                                                    </span>
                                                                )}
                                                                {product.mainframe_color && (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                                                                        Frame: {product.mainframe_color}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {product.size && (
                                                                <div className="text-sm text-gray-500 mt-1">
                                                                    Size: {product.size}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {formatCurrency(product.piece_price)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(product.updated_at)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {products?.links && (
                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="text-sm text-gray-700">
                                                Showing {products.from} to {products.to} of {products.total} results
                                                {searchTerm && <span className="ml-1">for "{searchTerm}"</span>}
                                            </div>
                                            <div className="flex space-x-1">
                                                {products.links.map((link, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => link.url && router.get(link.url)}
                                                        disabled={!link.url}
                                                        className={`px-3 py-2 text-sm rounded-md ${
                                                            link.active
                                                                ? 'bg-blue-600 text-white'
                                                                : link.url
                                                                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        {searchTerm ? 'No products found' : 'No products available'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {searchTerm 
                                            ? 'Try adjusting your search criteria or clear the search to see all products.'
                                            : 'Get started by uploading a product file.'
                                        }
                                    </p>
                                    <div className="mt-6 flex justify-center space-x-3">
                                        {searchTerm && (
                                            <button
                                                onClick={clearSearch}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Clear Search
                                            </button>
                                        )}
                                        <button
                                            onClick={() => router.get(route('file-manager'))}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Upload Products
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
