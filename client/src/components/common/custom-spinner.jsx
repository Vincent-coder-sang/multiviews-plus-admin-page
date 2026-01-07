import React from 'react'
const CustomSpinner = () => {
    const loading = true; // Replace with your loading state

    return (
        <div>
            {loading ? (
                <ClipLoader color="#3498db" loading={loading} size={50} />
            ) : (
                <p>Content Loaded</p>
            )}
        </div>
    );
}

export default CustomSpinner