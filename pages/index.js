import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import Link from 'next/link'

import Layout from 'components/layout';

const Home = () => {
  return (
    <Layout title="Home">
        <main>
            <h1>Snapdragon retrieval</h1>
            <Link href="/providers">
                <a>Providers</a>
            </Link>
        </main>
    </Layout>
  )
}

export default Home;
