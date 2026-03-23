const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("No authenticated user found");
        const token = await currentUser.getIdToken();

        const payload = {
            fullName: formData.fullName,
            phone: `+91${formData.phone}`, 
            spectrumAlum: formData.spectrumAlum,
            profession: formData.profession,
            dob: formData.dob,
            collegeDetails: {
                institutionName: formData.institutionName
            }
        };

        const response = await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update profile");
        }

        toast.success("Profile setup complete!");
        
        // 1. Force the global context to pull the new DB data
        await refreshData();
        
        // 2. Clear out the stale cache just to be perfectly safe
        localStorage.removeItem('spectrum_profile');
        
        // 3. Trigger the dashboard updates and close the modal
        if(onComplete) onComplete(); 
        onClose();
        
    } catch (error) {
        toast.error(error.message || "Failed to update profile");
    } finally {
        setLoading(false);
    }
};
