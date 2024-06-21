import { createClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';

const supabaseUrl = process.env.VITE_SUPABASE_PROJECT_URL;
const supabaseKey = process.env.VITE_SUPABASE_API_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export const queryClient = new QueryClient();

const checkAndCreateEventTable = async () => {
    const { error: functionError } = await supabase.rpc('create_event_table');
    if (functionError) {
        console.error('Error creating event table:', functionError);
    } else {
        console.log('Event table checked/created successfully');
    }

    const { error: tableError } = await supabase.from('event').select('*').limit(1);
    if (tableError) {
        console.error('Error accessing event table:', tableError);
    } else {
        console.log('Event table accessed successfully');
    }
};

export function SupabaseProvider({ children }) {
    useEffect(() => {
        checkAndCreateEventTable();
    }, []);

    return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const fromSupabase = async (query) => {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
};

/* supabase integration types

### event

| name       | type        | format | required |
|------------|-------------|--------|----------|
| id         | int8        | number | true     |
| name       | text        | string | true     |
| created_at | timestamptz | string | true     |
| date       | date        | string | true     |

*/

// Hooks for event table

export const useEvents = () => useQuery({
    queryKey: ['events'],
    queryFn: () => fromSupabase(supabase.from('event').select('*')),
});

export const useEvent = (id) => useQuery({
    queryKey: ['event', id],
    queryFn: () => fromSupabase(supabase.from('event').select('*').eq('id', id).single()),
});

export const useAddEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newEvent) => fromSupabase(supabase.from('event').insert([newEvent])),
        onSuccess: () => {
            queryClient.invalidateQueries('events');
        },
    });
};

export const useUpdateEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (updatedEvent) => fromSupabase(supabase.from('event').update(updatedEvent).eq('id', updatedEvent.id)),
        onSuccess: () => {
            queryClient.invalidateQueries('events');
            queryClient.invalidateQueries(['event', updatedEvent.id]);
        },
    });
};

export const useDeleteEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('event').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('events');
        },
    });
};